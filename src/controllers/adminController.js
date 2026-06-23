import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";

export const adminLogin = (req, res) => {
  const { email, mobile, password } = req.body;

  if (!email || !mobile || !password) {
    return res.status(400).json({
      success: false,
      message: "Email, Mobile and Password are required",
    });
  }

  adminModel.findAdminByEmailAndMobile(
    email,
    mobile,
    async (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      const admin = result[0];

      const isPasswordValid = await bcrypt.compare(
        password,
        admin.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid Password",
        });
      }

      const token = jwt.sign(
        {
          adminId: admin.id,
          role: admin.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.status(200).json({
        success: true,
        message: "Login Successful",
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          role: admin.role,
        },
      });
    }
  );
};