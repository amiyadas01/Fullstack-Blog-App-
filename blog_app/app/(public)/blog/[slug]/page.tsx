export default async function BlogSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  console.log("slug", slug);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          This is the blog post page for slug: {slug}
        </h1>
      </main>
    </div>
  );
}
