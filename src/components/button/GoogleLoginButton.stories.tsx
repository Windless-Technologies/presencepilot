import type { Meta, StoryObj } from '@storybook/react'
import GoogleLoginButton from './GoogleLoginButton'

const meta: Meta<typeof GoogleLoginButton> = {
  title: 'components/button/GoogleLoginButton',
  component: GoogleLoginButton
}

export default meta
type Story = StoryObj<typeof GoogleLoginButton>

export const Default: Story = {}
