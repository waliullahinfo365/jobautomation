export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateWebEnv } = await import("./src/config/validate-env");
    validateWebEnv();
  }
}
