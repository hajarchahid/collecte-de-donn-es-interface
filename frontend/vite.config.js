import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        allowedHosts: ['www.speechai.fsac.ac.ma', 'speechai.fsac.ac.ma'],
        watch: {
            usePolling: true
        }
    }
})
