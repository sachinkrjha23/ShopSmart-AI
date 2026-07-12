import PDFDocument from "pdfkit";

const PAGE_WIDTH = 595;
const MARGIN_X = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 495

const COLORS = {
  primary: "#4f46e5",
  primaryLight: "#eef2ff",
  dark: "#1e293b",
  muted: "#64748b",
  faint: "#94a3b8",
  border: "#e2e8f0",
  rowAlt: "#fafafa",
  success: "#16a34a",
  white: "#ffffff",
};

const formatINR = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const loadImageBuffer = async (url) => {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

export const generateInvoiceBuffer = async (order) => {
  const items = (order.items || []).filter(Boolean);

  // Fetch all product images up front, in parallel — faster and more
  // predictable than awaiting one-by-one inside the drawing loop.
  const imageBuffers = await Promise.all(
    items.map((item) => loadImageBuffer(item.image)),
  );

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 0,
        size: "A4",
        info: {
          Title: `Invoice-${order.id.slice(0, 8)}`,
          Author: "ShopSmart AI",
        },
      });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // ============================================================
      // HEADER BAND
      // ============================================================
      doc.rect(0, 0, PAGE_WIDTH, 110).fill(COLORS.primary);
      doc
        .fontSize(26)
        .font("Helvetica-Bold")
        .fillColor(COLORS.white)
        .text("ShopSmart AI", MARGIN_X, 32, {
          width: CONTENT_WIDTH,
          align: "center",
        });
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor(COLORS.primaryLight)
        .text("INVOICE", MARGIN_X, 66, { width: CONTENT_WIDTH, align: "center" });

      // ============================================================
      // INVOICE META ROW
      // ============================================================
      let y = 130;
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(COLORS.dark)
        .text(`Order #: ${order.id.slice(0, 8).toUpperCase()}`, MARGIN_X, y, {
          width: 250,
          align: "left",
        });
      doc
        .font("Helvetica")
        .fillColor(COLORS.muted)
        .text(`Invoice #: INV-${order.id.slice(0, 8).toUpperCase()}`, 300, y, {
          width: 245,
          align: "right",
        });
      doc.text(`Date: ${formatDate(order.created_at)}`, 300, y + 14, {
        width: 245,
        align: "right",
      });

      y += 45;

      // ============================================================
      // BILL TO / SHIP TO BOXES
      // ============================================================
      const boxWidth = (CONTENT_WIDTH - 15) / 2;
      const boxHeight = 100;

      doc
        .roundedRect(MARGIN_X, y, boxWidth, boxHeight, 6)
        .fill(COLORS.primaryLight);
      doc
        .roundedRect(MARGIN_X + boxWidth + 15, y, boxWidth, boxHeight, 6)
        .fill(COLORS.primaryLight);

      const writeAddressBlock = (label, x) => {
        let by = y + 14;
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor(COLORS.primary)
          .text(label, x + 15, by, { width: boxWidth - 30 });
        by += 16;
        doc.fontSize(9).font("Helvetica").fillColor(COLORS.dark);
        doc.text(
          order.full_name || order.buyer_name || "Customer",
          x + 15,
          by,
          {
            width: boxWidth - 30,
          },
        );
        by += 13;
        doc.fillColor(COLORS.muted);
        doc.text(order.address || "Address not provided", x + 15, by, {
          width: boxWidth - 30,
        });
        by += 13;
        const locationLine =
          `${order.city || ""}, ${order.state || ""} - ${order.pincode || ""}`.trim();
        doc.text(locationLine || "Location not provided", x + 15, by, {
          width: boxWidth - 30,
        });
        by += 13;
        doc.text(`Phone: ${order.phone || "N/A"}`, x + 15, by, {
          width: boxWidth - 30,
        });
      };

      writeAddressBlock("BILL TO", MARGIN_X);
      writeAddressBlock("SHIP TO", MARGIN_X + boxWidth + 15);

      // Email under the Bill To box only
      doc
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(`Email: ${order.buyer_email || "N/A"}`, MARGIN_X + 15, y + 88, {
          width: boxWidth - 30,
        });

      y += boxHeight + 25;

      // ============================================================
      // ITEMS TABLE
      // ============================================================
      const col = { img: MARGIN_X, name: 90, qty: 330, price: 390, total: 470 };
      const rowHeight = 34;

      doc
        .roundedRect(MARGIN_X, y, CONTENT_WIDTH, 24, 4)
        .fill(COLORS.primaryLight);
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(COLORS.primary)
        .text("Item", col.name, y + 7, { width: 230 })
        .text("Qty", col.qty, y + 7, { width: 50, align: "center" })
        .text("Price", col.price, y + 7, { width: 70, align: "right" })
        .text("Total", col.total, y + 7, { width: 65, align: "right" });

      y += 28;

      items.forEach((item, index) => {
        const title = item.title || "Product";
        const quantity = item.quantity || 1;
        const price = Number(item.price) || 0;
        const lineTotal = quantity * price;
        const imageBuffer = imageBuffers[index];

        if (index % 2 === 0) {
          doc
            .rect(MARGIN_X, y - 4, CONTENT_WIDTH, rowHeight)
            .fill(COLORS.rowAlt);
        }

        if (imageBuffer) {
          try {
            doc.image(imageBuffer, col.img, y - 2, { fit: [26, 26] });
          } catch {
            // corrupt/unsupported image data — skip silently, text still renders
          }
        }

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(COLORS.dark)
          .text(title, col.name, y + 4, { width: 230 });
        doc
          .fillColor(COLORS.muted)
          .text(String(quantity), col.qty, y + 4, {
            width: 50,
            align: "center",
          });
        doc.text(formatINR(price), col.price, y + 4, {
          width: 70,
          align: "right",
        });
        doc
          .fillColor(COLORS.dark)
          .font("Helvetica-Bold")
          .text(formatINR(lineTotal), col.total, y + 4, {
            width: 65,
            align: "right",
          });

        y += rowHeight;
      });

      doc
        .moveTo(MARGIN_X, y)
        .lineTo(MARGIN_X + CONTENT_WIDTH, y)
        .strokeColor(COLORS.border)
        .stroke();

      y += 20;

      // ============================================================
      // TOTALS
      // ============================================================
      // Derive the actual tax rate that was applied to THIS order from its
      // own numbers, rather than looking up current store_settings — the
      // rate could have changed since the order was placed, and an invoice
      // should reflect what was really charged.
      const itemsPrice =
        Number(order.total_price) +
        Number(order.discount_amount || 0) -
        Number(order.tax_price || 0) -
        Number(order.shipping_price || 0);
      const discountedItemsPrice =
        itemsPrice - Number(order.discount_amount || 0);
      const taxPrice = Number(order.tax_price) || 0;
      const effectiveTaxRate =
        discountedItemsPrice > 0
          ? Math.round((taxPrice / discountedItemsPrice) * 100)
          : 0;

      const totalsBoxX = 300;
      const totalsBoxWidth = CONTENT_WIDTH - (totalsBoxX - MARGIN_X);
      const labelX = totalsBoxX + 15;
      const valueWidth = totalsBoxWidth - 30;

      const writeTotalLine = (label, value, opts = {}) => {
        doc
          .fontSize(opts.bold ? 11 : 9)
          .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
          .fillColor(opts.color || COLORS.muted)
          .text(label, labelX, y, { width: valueWidth * 0.5 });
        doc.text(value, labelX, y, { width: valueWidth, align: "right" });
        y += opts.bold ? 22 : 17;
      };

      writeTotalLine("Subtotal", formatINR(itemsPrice));

      if (Number(order.discount_amount) > 0) {
        writeTotalLine(
          `Discount (${order.coupon_code || "Coupon"})`,
          `-${formatINR(order.discount_amount)}`,
          { color: COLORS.success },
        );
      }

      writeTotalLine(
        "Shipping",
        Number(order.shipping_price) > 0
          ? formatINR(order.shipping_price)
          : "Free",
      );

      if (taxPrice > 0) {
        writeTotalLine(`Tax (${effectiveTaxRate}%)`, formatINR(taxPrice));
      }

      y += 6;
      doc
        .roundedRect(totalsBoxX, y, totalsBoxWidth, 34, 6)
        .fill(COLORS.primary);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(COLORS.white)
        .text("TOTAL", labelX, y + 10, { width: valueWidth * 0.5 })
        .text(formatINR(order.total_price), labelX, y + 10, {
          width: valueWidth,
          align: "right",
        });

      y += 60;

      // ============================================================
      // FOOTER BAND
      // ============================================================
      const footerY = Math.max(y, 700);
      doc.rect(0, footerY, PAGE_WIDTH, 100).fill(COLORS.primaryLight);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(COLORS.primary)
        .text(
          "Thank you for shopping with ShopSmart AI!",
          MARGIN_X,
          footerY + 22,
          {
            width: CONTENT_WIDTH,
            align: "center",
          },
        );
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.muted)
        .text(
          "This is a system-generated invoice. For any queries, please contact support.",
          MARGIN_X,
          footerY + 44,
          { width: CONTENT_WIDTH, align: "center" },
        );
      doc
        .fontSize(7)
        .fillColor(COLORS.faint)
        .text(
          `Generated on: ${new Date().toLocaleString("en-IN")}`,
          MARGIN_X,
          footerY + 62,
          {
            width: CONTENT_WIDTH,
            align: "center",
          },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
