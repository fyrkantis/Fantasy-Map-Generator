export default {
    root: './src',
    base: process.env.NETLIFY ? '/' : '/Fantasy-Map-Generator/',
    build: {
        outDir: '../dist',
        assetsDir: './',
    },
    test: {
        setupFiles: ['./vitest.setup.ts']
    },

    publicDir: '../public',
}