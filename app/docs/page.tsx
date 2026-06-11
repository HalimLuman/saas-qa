import type { Metadata } from 'next'
import DocsClient from './docs-client'

export const metadata: Metadata = {
  title: 'Documentation — softAssert',
  description: 'Complete guide to softAssert: test case management, AI generation, bug tracking, regression suites, API testing, integrations, webhooks, and billing.',
}

export default function DocsPage() {
  return <DocsClient />
}
