import type { Meta, StoryObj } from '@storybook/react'
import AuthButton from './AuthButton'
import { vi } from 'vitest'
import { useSession } from 'next-auth/react'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn()
}))

const meta: Meta<typeof AuthButton> = {
  title: './AuthButton',
  component: AuthButton
}

export default meta

type Story = StoryObj<typeof AuthButton>

export const Loading: Story = {
  render: () => {
    ;(useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'loading'
    })
    return <AuthButton />
  }
}

export const Unauthenticated: Story = {
  render: () => {
    ;(useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })
    return <AuthButton />
  }
}

export const Authenticated: Story = {
  render: () => {
    ;(useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          id: '123'
        }
      },
      status: 'authenticated'
    })
    return <AuthButton />
  }
}
