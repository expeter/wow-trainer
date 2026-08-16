import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const childProcesses = new Map()
let shuttingDown = false
let requestedExitCode = 0
let forceStopTimer

function signalChild(child, signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return

  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

function finishWhenStopped() {
  if (childProcesses.size > 0) return
  if (forceStopTimer) clearTimeout(forceStopTimer)
  process.exitCode = requestedExitCode
}

function stopAll(exitCode = 0, signal = 'SIGTERM') {
  if (!shuttingDown) {
    shuttingDown = true
    requestedExitCode = exitCode
    for (const child of childProcesses.values()) signalChild(child, signal)

    forceStopTimer = setTimeout(() => {
      for (const child of childProcesses.values()) signalChild(child, 'SIGKILL')
    }, 3_000)
    forceStopTimer.unref()
  }

  finishWhenStopped()
}

function start(scriptName) {
  const child = spawn(npmCommand, ['run', scriptName], {
    detached: process.platform !== 'win32',
    env: process.env,
    stdio: 'inherit',
  })
  childProcesses.set(scriptName, child)

  child.once('error', error => {
    console.error(`[dev] Unable to start ${scriptName}: ${error.message}`)
    stopAll(1)
  })

  child.once('exit', (code, signal) => {
    childProcesses.delete(scriptName)
    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? 1}`
      console.error(`[dev] ${scriptName} stopped unexpectedly (${reason}).`)
      stopAll(code ?? 1)
    }
    finishWhenStopped()
  })
}

process.once('SIGINT', () => stopAll(0, 'SIGINT'))
process.once('SIGTERM', () => stopAll(0, 'SIGTERM'))

start('dev:inbox')
start('dev:trainer')
