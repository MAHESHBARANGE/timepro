// controllers/authController.js
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

// Register new user (Admin only in production)
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role, department, managerId } = req.body;

//     // Check if user exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role,
//       department,
//       managerId
//     });

//     // Generate token
//     const token = generateToken(user._id);

//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         department: user.department
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, managerId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userData = { name, email, password, role, department };

    if (role === "employee" && managerId) {
      userData.managerId = managerId;
    }

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error); // <--- must log
    res.status(500).json({ message: error.message });
  }
};


// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (Admin/Manager only)
exports.getAllUsers = async (req, res) => {
  try {
    let query = {};

    // If manager, only show their team
    if (req.user.role === "manager") {
      query = { managerId: req.user.id };
    }

    const users = await User.find(query).select("-password");

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
