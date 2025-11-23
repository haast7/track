import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (error: any) {
      const errorMessage =
        error.code === 'auth/invalid-credential'
          ? 'Email ou senha incorretos'
          : error.code === 'auth/user-not-found'
          ? 'Usuário não encontrado'
          : error.code === 'auth/wrong-password'
          ? 'Senha incorreta'
          : 'Erro ao fazer login. Tente novamente.'
      setError('root', { message: errorMessage })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 border rounded-lg bg-card">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Login
        </h1>
        {errors.root && (
          <div className="p-3 text-sm text-white bg-red-500 rounded">
            {errors.root.message}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 mt-1 border rounded-md bg-background text-foreground border-input"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 mt-1 border rounded-md bg-background text-foreground border-input"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-white rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-sm text-center text-muted-foreground">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
