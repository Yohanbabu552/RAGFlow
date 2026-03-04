/**
 * Login Page — Split-screen design matching EMAMI reference.
 *
 * Left panel: Gradient branding with feature checklist.
 * Right panel: Login/Register form with show/hide password toggle.
 *
 * Keeps all existing auth logic: useLogin, useRegister, RSA encryption,
 * SSO channels, remember me, redirect on isLogin.
 */

import SvgIcon from '@/components/svg-icon';
import { useAuth } from '@/hooks/auth-hooks';
import {
  useLogin,
  useLoginChannels,
  useLoginWithChannel,
  useRegister,
} from '@/hooks/use-login-request';
import { useSystemConfig } from '@/hooks/use-system-request';
import { rsaPsw } from '@/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button, ButtonLoading } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Login = () => {
  const [title, setTitle] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loading: signLoading } = useLogin();
  const { register, loading: registerLoading } = useRegister();
  const { channels, loading: channelsLoading } = useLoginChannels();
  const { login: loginWithChannel, loading: loginWithChannelLoading } =
    useLoginWithChannel();
  const { t } = useTranslation('translation', { keyPrefix: 'login' });

  const loading =
    signLoading ||
    registerLoading ||
    channelsLoading ||
    loginWithChannelLoading;
  const { config } = useSystemConfig();
  const registerEnabled = config?.registerEnabled !== 0;

  const { isLogin } = useAuth();
  useEffect(() => {
    if (isLogin) {
      navigate('/');
    }
  }, [isLogin, navigate]);

  const handleLoginWithChannel = async (channel: string) => {
    await loginWithChannel(channel);
  };

  const changeTitle = () => {
    if (title === 'login' && !registerEnabled) {
      return;
    }
    setTitle(title === 'login' ? 'register' : 'login');
  };

  const FormSchema = z
    .object({
      nickname: z.string(),
      email: z
        .string()
        .email()
        .min(1, { message: t('emailPlaceholder') }),
      password: z.string().min(1, { message: t('passwordPlaceholder') }),
      remember: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      if (title === 'register' && !data.nickname) {
        ctx.addIssue({
          path: ['nickname'],
          message: 'nicknamePlaceholder',
          code: z.ZodIssueCode.custom,
        });
      }
    });
  const form = useForm({
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
      remember: false,
    },
    resolver: zodResolver(FormSchema),
  });

  const onCheck = async (params: z.infer<typeof FormSchema>) => {
    try {
      const rsaPassWord = rsaPsw(params.password) as string;

      if (title === 'login') {
        const code = await login({
          email: `${params.email}`.trim(),
          password: rsaPassWord,
        });
        if (code === 0) {
          navigate('/');
        }
      } else {
        const code = await register({
          nickname: params.nickname,
          email: params.email,
          password: rsaPassWord,
        });
        if (code === 0) {
          setTitle('login');
        }
      }
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0F1F3A] via-[#1F3864] to-[#0F2847]">
      {/* Centered card container */}
      <div className="flex-1 flex items-center justify-center p-5 md:p-10">
        <div className="flex w-full max-w-[900px] min-h-[520px] bg-white rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          {/* ── Left Branding Panel ─────────────────────── */}
          <div className="hidden md:flex w-[380px] shrink-0 flex-col justify-between bg-gradient-to-br from-[#1F3864] to-[#0078D4] p-12 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-[260px] h-[260px] rounded-full bg-white/[0.04]" />
            <div className="absolute -bottom-[60px] -left-[60px] w-[200px] h-[200px] rounded-full bg-white/[0.03]" />

            {/* Top section */}
            <div className="relative z-10">
              {/* Brand logo */}
              <div className="flex items-center gap-3 mb-12">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/15 backdrop-blur-[10px]">
                  <span className="text-lg font-extrabold text-white">E</span>
                </div>
                <div>
                  <span className="block text-lg font-bold text-white">
                    Emami
                  </span>
                  <span className="block text-[11px] text-white/60">
                    Document Intelligence
                  </span>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-bold text-white leading-tight mb-3">
                Intelligent Document Processing Platform
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Upload, extract, and query your product documents with
                AI-powered intelligence.
              </p>
            </div>

            {/* Feature checklist */}
            <div className="relative z-10 space-y-2">
              {[
                'AI-powered OCR extraction',
                'Smart document Q&A chat',
                'Multi-lingual support',
                'Secure role-based access',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 py-2 text-[13px] font-medium text-white/80"
                >
                  <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/[0.12]">
                    <Check className="size-3.5 text-[#4ADE80]" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Form Panel ────────────────────────── */}
          <div className="flex-1 flex flex-col justify-center px-8 py-10 sm:px-11">
            <h2 className="text-2xl font-bold text-[#1A202C] mb-1.5">
              {title === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-[#64748B] mb-8">
              {title === 'login'
                ? 'Sign in to your account to continue'
                : 'Sign up to get started with Emami Document Intelligence'}
            </p>

            <Form {...form}>
              <form
                className="flex flex-col gap-5"
                onSubmit={form.handleSubmit(onCheck)}
              >
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#1A202C]">
                        {t('emailLabel')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@emami.com"
                          autoComplete="email"
                          className="h-11 rounded-lg border-[#E2E8F0] px-4 text-sm focus:border-[#0078D4] focus:ring-[#0078D4]/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nickname (register only) */}
                {title === 'register' && (
                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-semibold text-[#1A202C]">
                          {t('nicknameLabel')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('nicknamePlaceholder')}
                            autoComplete="username"
                            className="h-11 rounded-lg border-[#E2E8F0] px-4 text-sm focus:border-[#0078D4] focus:ring-[#0078D4]/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold text-[#1A202C]">
                        {t('passwordLabel')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('passwordPlaceholder')}
                            autoComplete={
                              title === 'login'
                                ? 'current-password'
                                : 'new-password'
                            }
                            className="h-11 rounded-lg border-[#E2E8F0] px-4 pr-11 text-sm focus:border-[#0078D4] focus:ring-[#0078D4]/20"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember me + Forgot password (login only) */}
                {title === 'login' && (
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="remember"
                      render={({ field }) => (
                        <FormItem className="flex-row items-center space-y-0">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                }}
                                className="border-[#E2E8F0] data-[state=checked]:bg-[#0078D4] data-[state=checked]:border-[#0078D4]"
                              />
                              <FormLabel
                                className={cn(
                                  'text-[13px] cursor-pointer font-normal',
                                  {
                                    'text-[#94A3B8]': !field.value,
                                    'text-[#64748B]': field.value,
                                  },
                                )}
                              >
                                {t('rememberMe')}
                              </FormLabel>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <button
                      type="button"
                      className="text-[13px] font-medium text-[#0078D4] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit button */}
                <ButtonLoading
                  type="submit"
                  loading={loading}
                  className="h-[50px] w-full rounded-lg bg-gradient-to-r from-[#0078D4] to-[#106EBE] text-[15px] font-semibold text-white hover:from-[#106EBE] hover:to-[#0A5EA0] hover:shadow-[0_4px_16px_rgba(0,120,212,0.3)] hover:-translate-y-0.5 transition-all mt-2"
                >
                  {title === 'login' ? 'Sign In' : t('continue')}
                </ButtonLoading>

                {/* SSO channels */}
                {title === 'login' && channels && channels.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <div className="relative flex items-center gap-3 my-1">
                      <div className="flex-1 border-t border-[#E2E8F0]" />
                      <span className="text-[11px] text-[#94A3B8] uppercase tracking-wide">
                        or continue with
                      </span>
                      <div className="flex-1 border-t border-[#E2E8F0]" />
                    </div>
                    {channels.map((item) => (
                      <Button
                        variant={'outline'}
                        key={item.channel}
                        onClick={() => handleLoginWithChannel(item.channel)}
                        className="w-full h-11 border-[#E2E8F0] text-[#1A202C] hover:bg-[#F4F6F9]"
                      >
                        <div className="flex items-center gap-2">
                          <SvgIcon
                            name={item.icon || 'sso'}
                            width={18}
                            height={18}
                          />
                          <span className="text-sm">
                            Sign in with {item.display_name}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </form>
            </Form>

            {/* Toggle login/register */}
            {title === 'login' && registerEnabled && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[#94A3B8]">
                  {t('signInTip')}
                  <button
                    onClick={changeTitle}
                    className="ml-1 font-medium text-[#0078D4] hover:underline"
                  >
                    {t('signUp')}
                  </button>
                </p>
              </div>
            )}
            {title === 'register' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-[#94A3B8]">
                  {t('signUpTip')}
                  <button
                    onClick={changeTitle}
                    className="ml-1 font-medium text-[#0078D4] hover:underline"
                  >
                    {t('login')}
                  </button>
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-7 text-center text-xs text-[#94A3B8]">
              &copy; 2026 Emami Ltd. All rights reserved. Powered by Iksula.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
