import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
      <div>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Não é obrigatório ter conta para comprar — isto é só para acompanhar encomendas mais
          rápido da próxima vez.
        </p>
      </div>
      <LoginForm next={next ?? "/pt"} />
    </main>
  );
}
