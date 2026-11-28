import { useState, type FormEvent } from "react"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { ApiError, parseApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthCardLayout } from "@/features/auth/components/AuthCardLayout"
import { registerUser } from "@/features/auth/api/auth.api"
import { getSignupErrorMessage } from "@/features/auth/lib/auth-errors"
import { signupFormSchema, type SignupFormValues } from "@/features/auth/lib/auth.schemas"

type SignupField = keyof SignupFormValues

/** Renders the mobile-first account creation form and sends successful signups to email verification. */
export function SignupPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<SignupFormValues>({ firstName: "", lastName: "", email: "", password: "" })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupField, string>>>({})
  const [apiError, setApiError] = useState<ApiError | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: SignupField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setApiError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = signupFormSchema.safeParse(values)
    if (!result.success) {
      const nextErrors: Partial<Record<SignupField, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if ((field === "firstName" || field === "lastName" || field === "email" || field === "password") && !nextErrors[field]) {
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
      await registerUser(result.data)
      navigate("/verify-email", { state: { email: result.data.email } })
    } catch (error) {
      setApiError(error instanceof ApiError ? error : await parseApiError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCardLayout
      title="Create your account"
      description="Make an account to start learning with Nerdos."
      footer={<>Already have an account? <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">Log in</Link></>}
    >
      {apiError && <Alert variant="destructive" className="motion-feedback">
        <AlertTitle>We couldn't create your account</AlertTitle>
        <AlertDescription>{getSignupErrorMessage(apiError)}</AlertDescription>
      </Alert>}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-first-name">First name</Label>
          <Input
            id="signup-first-name"
            autoComplete="given-name"
            autoCapitalize="words"
            required
            maxLength={128}
            value={values.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            aria-invalid={Boolean(fieldErrors.firstName)}
            aria-describedby={fieldErrors.firstName ? "signup-first-name-error" : undefined}
          />
          {fieldErrors.firstName && <p className="motion-feedback text-sm text-destructive" id="signup-first-name-error">{fieldErrors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-last-name">Last name</Label>
          <Input id="signup-last-name" autoComplete="family-name" autoCapitalize="words" required maxLength={128}
            value={values.lastName} onChange={(event) => updateField("lastName", event.target.value)}
            aria-invalid={Boolean(fieldErrors.lastName)} aria-describedby={fieldErrors.lastName ? "signup-last-name-error" : undefined} />
          {fieldErrors.lastName && <p className="motion-feedback text-sm text-destructive" id="signup-last-name-error">{fieldErrors.lastName}</p>}
        </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            required
            maxLength={254}
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
          />
          {fieldErrors.email && <p className="motion-feedback text-sm text-destructive" id="signup-email-error">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              className="h-11 pr-12 text-base"
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              required
              maxLength={128}
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "signup-password-error" : "signup-password-help"}
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
          {fieldErrors.password
            ? <p className="motion-feedback text-sm text-destructive" id="signup-password-error">{fieldErrors.password}</p>
            : <p className="text-xs text-muted-foreground" id="signup-password-help">At least 12 characters.</p>}
        </div>

        <Button className="min-h-11 w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
