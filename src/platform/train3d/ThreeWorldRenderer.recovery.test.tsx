import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_TRAINING_SETTINGS } from '../trainingSettings'
import { createContractRoomState, contractRoomSnapshot } from './contractRoomSimulation'
import ThreeWorldRenderer from './ThreeWorldRenderer'

describe('ThreeWorldRenderer recovery', () => {
  it('surfaces a stable retry action when WebGL initialization fails', async () => {
    const factory = vi.fn(() => { throw new Error('webgl unavailable') })
    render(<ThreeWorldRenderer snapshot={contractRoomSnapshot(createContractRoomState())} cameraSettings={DEFAULT_TRAINING_SETTINGS.camera} onCameraSettingsChange={() => {}} onPlayerLook={() => {}} onBothButtonsForward={() => {}} rendererFactory={factory} />)
    expect(await screen.findByRole('alert', { name: '3D renderer recovery' })).toHaveTextContent('3D view unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Retry renderer' }))
    await waitFor(() => expect(factory).toHaveBeenCalledTimes(2))
  })
})
