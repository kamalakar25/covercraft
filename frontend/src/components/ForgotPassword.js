// src/components/ForgotPassword.js
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  useTheme,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { Email, Lock, VpnKey } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { motion } from "framer-motion";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

// Validation schemas for each step
const emailSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email, Ex:example@example.com")
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      "Invalid email format"
    ),
});

const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .required("OTP is required")
    .length(6, "OTP must be 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers"),
});

const passwordSchema = yup.object().shape({
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(
      step === 1 ? emailSchema : step === 2 ? otpSchema : passwordSchema
    ),
    mode: "onChange",
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.95 },
  };

  // Handle email submission
  const handleEmailSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email: data.email,
      });

      if (response.data.status === "User Not Exists!!") {
        setStatus({
          type: "error",
          message: "No account found with this email.",
        });
        return;
      }

      setToken(response.data.token);
      setUserId(response.data.id); // Use the explicit id from the response
      setStatus({ type: "success", message: "OTP sent to your email!" });
      setStep(2);
      reset();
    } catch (err) {
      setStatus({ type: "error", message: "Failed to send OTP. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/verify-otp/${userId}/${token}`,
        {
          otp: data.otp,
        }
      );

      if (response.data.status === "Invalid OTP") {
        setStatus({ type: "error", message: "Invalid OTP. Please try again." });
        return;
      }

      setStatus({ type: "success", message: "OTP verified successfully!" });
      setStep(3);
      reset();
    } catch (err) {
      setStatus({
        type: "error",
        message: "OTP verification failed or expired.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password reset
  const handlePasswordSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/reset-password/${userId}/${token}`,
        {
          password: data.password,
        }
      );

      setStatus({ type: "success", message: "Password reset successfully!" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus({ type: "error", message: "Failed to reset password." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your email to receive a one-time password.
            </Typography>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email Address"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
              )}
            />
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Verify OTP
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the 6-digit OTP sent to your email.
            </Typography>
            <Controller
              name="otp"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="OTP"
                  error={!!errors.otp}
                  helperText={errors.otp?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
              )}
            />
          </>
        );
      case 3:
        return (
          <>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your new password.
            </Typography>
            <Controller
              name="password"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="New Password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
              )}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 4,
            maxWidth: 400,
            width: "100%",
            background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
          }}
        >
          {status.message && (
            <Alert severity={status.type} sx={{ mb: 2 }}>
              {status.message}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit(
              step === 1
                ? handleEmailSubmit
                : step === 2
                ? handleOtpSubmit
                : handlePasswordSubmit
            )}
          >
            {renderStepContent()}

            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background:
                    "linear-gradient(45deg, #6b48ff 30%, #8a2be2 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #5a38e0 30%, #7920c8 90%)",
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : step === 1 ? (
                  "Send OTP"
                ) : step === 2 ? (
                  "Verify OTP"
                ) : (
                  "Reset Password"
                )}
              </Button>
            </motion.div>

            {step === 1 && (
              <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
                Back to{" "}
                <Box
                  component="span"
                  sx={{ color: "primary.main", cursor: "pointer" }}
                  onClick={() => navigate("/login")}
                >
                  Login
                </Box>
              </Typography>
            )}
          </Box>
        </Paper>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPassword;
