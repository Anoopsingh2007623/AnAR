import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

// =====================================
// GENERATE ANAR TOKEN
// =====================================
const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

// =====================================
// USER RESPONSE
// =====================================
const getUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email || null,
    phone: user.phone || null,
    avatar: user.avatar || "",
    accountType: user.accountType,
    followersCount: user.followersCount,
  };
};

// =====================================
// GENERATE UNIQUE USERNAME
// =====================================
const generateUniqueUsername = async (name, email) => {
  let baseUsername = "";

  if (email) {
    baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  if (!baseUsername) {
    baseUsername = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  if (!baseUsername) {
    baseUsername = "user";
  }

  baseUsername = baseUsername.substring(0, 24);

  let username = baseUsername;
  let counter = 1;

  while (await User.exists({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

// =====================================
// REGISTER
// =====================================
export const register = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      password,
    } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username and password are required",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number is required",
      });
    }

    const cleanUsername = username
      .toLowerCase()
      .trim();

    const existingUsername = await User.findOne({
      username: cleanUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    if (email) {
      const cleanEmail = email
        .toLowerCase()
        .trim();

      const existingEmail = await User.findOne({
        email: cleanEmail,
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    if (phone) {
      const cleanPhone = phone.trim();

      const existingPhone = await User.findOne({
        phone: cleanPhone,
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: email
        ? email.toLowerCase().trim()
        : undefined,
      phone: phone
        ? phone.trim()
        : undefined,
      passwordHash,
      authProvider: "local",
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",

      token,

      user: getUserResponse(user),
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating account",
    });
  }
};

// =====================================
// LOGIN
// =====================================
export const login = async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Identifier and password are required",
      });
    }

    const cleanIdentifier =
      identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        {
          email: cleanIdentifier,
        },
        {
          username: cleanIdentifier,
        },
        {
          phone: identifier.trim(),
        },
      ],
    }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // BLOCKED USER CHECK
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked by admin.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",

      token,

      user: getUserResponse(user),
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while logging in",
    });
  }
};

// =====================================
// GOOGLE LOGIN
// =====================================
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error(
        "GOOGLE_CLIENT_ID is missing in .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Google login is not configured on server",
      });
    }

    // =================================
    // VERIFY GOOGLE ID TOKEN
    // =================================
    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          process.env.GOOGLE_CLIENT_ID,
      });

    const payload =
      ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid Google account information",
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message:
          "Google account email could not be verified",
      });
    }

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message:
          "Google email is not verified",
      });
    }

    const cleanEmail =
      email.toLowerCase().trim();

    // =================================
    // FIND BY GOOGLE ID
    // =================================
    let user = await User.findOne({
      googleId,
    });

    // =================================
    // IF NOT FOUND, FIND BY EMAIL
    // =================================
    if (!user) {
      user = await User.findOne({
        email: cleanEmail,
      });
    }

    // =================================
    // EXISTING USER
    // =================================
    if (user) {
      // BLOCKED USER
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been blocked by admin.",
        });
      }

      // Link Google account with existing account
      user.googleId = googleId;

      if (!user.authProvider) {
        user.authProvider = "local";
      }

      // Update avatar only if current avatar is empty
      if (!user.avatar && picture) {
        user.avatar = picture;
      }

      await user.save();
    }

    // =================================
    // NEW GOOGLE USER
    // =================================
    if (!user) {
      const username =
        await generateUniqueUsername(
          name || "AnAR User",
          cleanEmail
        );

      user = await User.create({
        name:
          name?.trim() ||
          "AnAR User",

        username,

        email: cleanEmail,

        avatar: picture || "",

        googleId,

        authProvider: "google",
      });
    }

    // =================================
    // GENERATE ANAR JWT
    // =================================
    const token = generateToken(
      user._id
    );

    return res.json({
      success: true,
      message:
        "Google login successful",

      token,

      user: getUserResponse(user),
    });
  } catch (error) {
    console.error(
      "GOOGLE LOGIN ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Google authentication failed",
    });
  }
};