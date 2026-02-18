export default {
    root: './src',
    base: process.env.NETLIFY ? '/' : '/Fantasy-Map-Generator/',
    build: {
        outDir: '../dist',
        assetsDir: './',
    },
    test: {
        globalSetup: './vitest.global-setup.ts',
        setupFiles: ['./vitest.setup.ts'],
    },
    publicDir: '../public',
}