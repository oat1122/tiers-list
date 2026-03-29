"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInSchema, type SignInInput } from "@/lib/validations";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SignInForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        return;
      }

      // Success
      router.push("/");
      router.refresh();
    } catch (error) {
      setServerError(
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ลองตรวจสอบสัญญาณอินเทอร์เน็ต",
      );
      console.error(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="w-full shadow-2xl border-primary/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        {/* Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

        <CardHeader className="space-y-3 pb-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2"
          >
            <Lock className="w-6 h-6 text-primary" />
          </motion.div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
            ยินดีต้อนรับกลับมา
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 font-medium">
            กรุณาเข้าสู่ระบบเพื่อจัดการ Tier Lists ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 mb-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{serverError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2 relative group">
                <Label
                  htmlFor="email"
                  className={`text-sm font-semibold transition-colors ${
                    errors.email ? "text-destructive" : "text-foreground/80"
                  }`}
                >
                  อีเมล
                </Label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                      errors.email
                        ? "text-destructive"
                        : "text-muted-foreground group-focus-within:text-primary"
                    }`}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...register("email")}
                    disabled={isSubmitting}
                    className={`pl-10 h-11 transition-all duration-200 border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary ${
                      errors.email
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "hover:border-muted-foreground/40 bg-muted/30"
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-destructive font-medium mt-1.5"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Field */}
              <div className="space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className={`text-sm font-semibold transition-colors ${
                      errors.password
                        ? "text-destructive"
                        : "text-foreground/80"
                    }`}
                  >
                    รหัสผ่าน
                  </Label>
                </div>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                      errors.password
                        ? "text-destructive"
                        : "text-muted-foreground group-focus-within:text-primary"
                    }`}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    disabled={isSubmitting}
                    className={`pl-10 h-11 transition-all duration-200 border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary ${
                      errors.password
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "hover:border-muted-foreground/40 bg-muted/30"
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-destructive font-medium mt-1.5"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold tracking-wide mt-6 transition-all active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/40 bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">
            ยังไม่มีบัญชีใช่หรือไม่?{" "}
            <a
              href="#"
              className="text-primary hover:text-primary/80 font-semibold hover:underline underline-offset-4 transition-colors"
            >
              ติดต่อแอดมิน
            </a>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
