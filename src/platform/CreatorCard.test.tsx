import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CreatorCard from './CreatorCard'

describe('creator business card', () => {
  it('preserves the SPEC-002 identity and destinations in the Season 2 shell', () => {
    render(<CreatorCard />)
    const card = screen.getByLabelText('About Pestivator')
    expect(card).toHaveTextContent('pestivator#2515')
    expect(within(card).getByRole('link', { name: 'Raider.IO ↗' })).toHaveAttribute('href', 'https://raider.io/characters/eu/antonidas/Pestivator')
    expect(within(card).getByRole('link', { name: 'Pestivator on Twitch' })).toHaveAttribute('href', 'https://twitch.tv/pestivator')
    expect(within(card).getByRole('link', { name: /buy me a coffee/i })).toHaveAttribute('href', expect.stringContaining('Midnight%20Season%202%20Trainer'))
    expect(within(card).getByAltText("Pestivator's gnome avatar")).toBeVisible()
  })
})
