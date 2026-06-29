import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";

const isValidUUID = (id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

//  Add Address 
export const addAddress = catchAsyncErrors(async (req, res, next) => {
    const { full_name, phone, address, city, state, country, pincode, is_default } = req.body;

    // 1. Validate required fields
    if (!full_name || !phone || !address || !city || !state || !country || !pincode) {
        return next(new ErrorHandler("Please provide all required fields.", 400));
    }

    // 2. Validate phone
    if (!/^[6-9]\d{9}$/.test(phone)) {
        return next(new ErrorHandler("Please provide a valid 10-digit Indian phone number.", 400));
    }

    // 3. Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
        return next(new ErrorHandler("Please provide a valid 6-digit pincode.", 400));
    }

    // 4. Check max 5 addresses per user
    const count = await database.query(
        `SELECT COUNT(*) FROM user_addresses WHERE user_id = $1`,
        [req.user.id]
    );

    if (parseInt(count.rows[0].count) >= 5) {
        return next(new ErrorHandler("Maximum 5 addresses allowed. Please delete one to add a new address.", 400));
    }

    const client = await database.connect();

    try {
        await client.query("BEGIN");

        // 5. If this is default, unset all others first
        if (is_default) {
            await client.query(
                `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`,
                [req.user.id]
            );
        }

        // 6. If this is the first address, make it default automatically
        const isFirstAddress = parseInt(count.rows[0].count) === 0;

        // 7. Insert new address
        const newAddress = await client.query(
            `INSERT INTO user_addresses 
             (user_id, full_name, phone, address, city, state, country, pincode, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                req.user.id,
                full_name.trim(),
                phone.trim(),
                address.trim(),
                city.trim(),
                state.trim(),
                country.trim(),
                pincode.trim(),
                is_default || isFirstAddress,
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Address added successfully.",
            address: newAddress.rows[0],
        });

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

//  Get All Addresses 
export const getAllAddresses = catchAsyncErrors(async (req, res, next) => {
    const addresses = await database.query(
        `SELECT * FROM user_addresses 
         WHERE user_id = $1 
         ORDER BY is_default DESC, created_at DESC`,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        count: addresses.rows.length,
        addresses: addresses.rows,
    });
});

//  Get Single Address 
export const getSingleAddress = catchAsyncErrors(async (req, res, next) => {

    if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid address ID.", 400));
    }
    
    const address = await database.query(
        `SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
    );

    if (address.rows.length === 0) {
        return next(new ErrorHandler("Address not found.", 404));
    }

    res.status(200).json({
        success: true,
        address: address.rows[0],
    });
});

//  Edit Address 
export const editAddress = catchAsyncErrors(async (req, res, next) => {

    if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid address ID.", 400));
    }

    const { full_name, phone, address, city, state, country, pincode, is_default } = req.body;

    // 1. Check address belongs to user
    const existing = await database.query(
        `SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
        return next(new ErrorHandler("Address not found.", 404));
    }

    // 2. Validate phone if provided
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
        return next(new ErrorHandler("Please provide a valid 10-digit Indian phone number.", 400));
    }

    // 3. Validate pincode if provided
    if (pincode && !/^\d{6}$/.test(pincode)) {
        return next(new ErrorHandler("Please provide a valid 6-digit pincode.", 400));
    }

    const client = await database.connect();

    try {
        await client.query("BEGIN");

        // 4. If setting as default, unset others first
        if (is_default) {
            await client.query(
                `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`,
                [req.user.id]
            );
        }

        // 5. Update — only update fields that are provided
        const updated = await client.query(
            `UPDATE user_addresses SET
                full_name  = COALESCE($1, full_name),
                phone      = COALESCE($2, phone),
                address    = COALESCE($3, address),
                city       = COALESCE($4, city),
                state      = COALESCE($5, state),
                country    = COALESCE($6, country),
                pincode    = COALESCE($7, pincode),
                is_default = COALESCE($8, is_default)
             WHERE id = $9 AND user_id = $10
             RETURNING *`,
            [
                full_name?.trim() || null,
                phone?.trim() || null,
                address?.trim() || null,
                city?.trim() || null,
                state?.trim() || null,
                country?.trim() || null,
                pincode?.trim() || null,
                is_default !== undefined ? is_default : null,
                req.params.id,
                req.user.id,
            ]
        );

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Address updated successfully.",
            address: updated.rows[0],
        });

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

//  Set Default Address 
export const setDefaultAddress = catchAsyncErrors(async (req, res, next) => {

    if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid address ID.", 400));
    }

    // 1. Check address belongs to user
    const existing = await database.query(
        `SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
        return next(new ErrorHandler("Address not found.", 404));
    }

    const client = await database.connect();

    try {
        await client.query("BEGIN");

        // 2. Unset all defaults
        await client.query(
            `UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`,
            [req.user.id]
        );

        // 3. Set new default
        const updated = await client.query(
            `UPDATE user_addresses SET is_default = TRUE 
             WHERE id = $1 AND user_id = $2 
             RETURNING *`,
            [req.params.id, req.user.id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Default address updated.",
            address: updated.rows[0],
        });

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

//  Delete Address 
export const deleteAddress = catchAsyncErrors(async (req, res, next) => {

    if (!isValidUUID(req.params.id)) {
    return next(new ErrorHandler("Invalid address ID.", 400));
    }

    // 1. Check address belongs to user
    const existing = await database.query(
        `SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
        return next(new ErrorHandler("Address not found.", 404));
    }

    // 2. Delete
    await database.query(
        `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
    );

    // 3. If deleted address was default, make the most recent one default
    if (existing.rows[0].is_default) {
        await database.query(
            `UPDATE user_addresses 
             SET is_default = TRUE 
             WHERE user_id = $1 
             AND id = (
                 SELECT id FROM user_addresses 
                 WHERE user_id = $1 
                 ORDER BY created_at DESC 
                 LIMIT 1
             )`,
            [req.user.id]
        );
    }

    const remaining = await database.query(
        `SELECT COUNT(*) FROM user_addresses WHERE user_id = $1`,
        [req.user.id]
    );

    res.status(200).json({
        success: true,
        message: "Address deleted successfully.",
        remainingAddresses: parseInt(remaining.rows[0].count),
    });
});