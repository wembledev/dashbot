import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { UnreadProvider } from '../contexts/unread-context'
import { CarModeProvider } from '../contexts/car-mode-context'
import { HelpDrawerProvider } from '../contexts/help-drawer-context'
import AppLayout from '../layouts/AppLayout'
import '../styles/app.css'

/** Pages that should NOT use the persistent SPA layout (e.g. auth pages). */
const NO_LAYOUT_PAGES = new Set(['auth/login', 'auth/qr_login'])

void createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob<{default: ResolvedComponent}>('../pages/**/*.tsx', {
      eager: true,
    })
    const page = pages[`../pages/${name}.tsx`]
    if (!page) {
      console.error(`Missing Inertia page component: '${name}.tsx'`)
    }

    // Apply persistent AppLayout to all pages except auth
    if (page && !NO_LAYOUT_PAGES.has(name)) {
      page.default.layout ||= (page: ReactNode) => <AppLayout>{page}</AppLayout>
    }

    return page
  },

  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <CarModeProvider>
          <UnreadProvider>
            <HelpDrawerProvider>
              <App {...props} />
            </HelpDrawerProvider>
          </UnreadProvider>
        </CarModeProvider>
      </StrictMode>
    )
  },

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
    },
    future: {
      useScriptElementForInitialPage: true,
      useDataInertiaHeadAttribute: true,
      useDialogForErrorModal: true,
      preserveEqualProps: true,
    },
  },
}).catch((error) => {
  // This ensures this entrypoint is only loaded on Inertia pages
  // by checking for the presence of the root element (#app by default).
  // Feel free to remove this `catch` if you don't need it.
  if (document.getElementById("app")) {
    throw error
  } else {
    console.error(
      "Missing root element.\n\n" +
      "If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n" +
      'Consider moving <%= vite_typescript_tag "inertia.tsx" %> to the Inertia-specific layout instead.',
    )
  }
})
