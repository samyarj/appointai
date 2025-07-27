export default async () => ({
  plugins: [
    (await import("@tailwindcss/postcss")).default,
    (await import("autoprefixer")).default,
  ],
});
