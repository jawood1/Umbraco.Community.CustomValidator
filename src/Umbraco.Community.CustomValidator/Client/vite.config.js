import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/manifest.ts", // your web component source file
            formats: ["es"],
            fileName: "umbraco-community-customvalidator",
        },
        outDir: "../wwwroot/App_Plugins/Umbraco.Community.CustomValidator", // all compiled files will be placed here
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [/^@umbraco/], // ignore the Umbraco Backoffice package in the build
        },
    }
});