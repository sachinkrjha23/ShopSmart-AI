import app from "./app.js";
import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLIENT_NAME,
    api_key : process.env.CLOUDINARY_CLIENT_API,
    api_secret : process.env.CLOUDINARY_CLIENT_SECRET
});

const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, ()=>{
    console.log(`Server running on Port No.: ${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        process.exit(1);
    }
});