import { useState, type FormEvent } from "react"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, parseApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout"
import { loginUser } from "@/features/auth/api/auth.api"
import { getLoginErrorMessage } from "@/features/auth/lib/auth-errors"
import { loginFormSchema, type LoginFormValues } from "@/features/auth/lib/auth.schemas"

type LoginField = keyof LoginFormValues

/** Renders the mobile-first sign-in form and refreshes the cached session after success. */
export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, string>>>({})
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = loginFormSchema.safeParse(values)
    if (!result.success) {
      const nextErrors: Partial<Record<LoginField, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if ((field === "email" || field === "password") && !nextErrors[field]) {
          nextErrors[field] = issue.message
        }
      }
      setFieldErrors(nextErrors)
      setApiError(null)
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    try {
      await loginUser(result.data)
      queryClient.setQueryData(["auth", "session"], true)
      await navigate("/dashboard", { replace: true })
    } catch (error) {
      setApiError(error instanceof ApiError ? error : await parseApiError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCardLayout
      title="Welcome back"
      description="Log in to continue learning with Nerdos."
      footer={<>New to Nerdos? <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/register">Create an account</Link></>}
    >
      {apiError && <Alert variant="destructive" className="motion-feedback">
        <AlertTitle>We couldn't log you in</AlertTitle>
        <AlertDescription>
          {getLoginErrorMessage(apiError)}
          {apiError.code === "EMAIL_NOT_VERIFIED" && <> <Link to="/verify-email" state={{ email: values.email }} className="font-medium underline underline-offset-4">Verify your email</Link></>}
        </AlertDescription>
      </Alert>}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            required
            maxLength={254}
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email && <p className="motion-feedback text-sm text-destructive" id="login-email-error">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password">Password</Label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              className="h-11 pr-12 text-base"
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={128}
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 inline-flex min-h-11 w-11 items-center justify-center rounded-r-3xl text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="motion-feedback text-sm text-destructive" id="login-password-error">{fieldErrors.password}</p>}
        </div>

        <Button className="min-h-11 w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
