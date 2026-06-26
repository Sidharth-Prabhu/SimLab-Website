import { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  Shield, 
  Cpu, 
  Globe, 
  Check, 
  Copy, 
  Download, 
  Mail, 
  ExternalLink, 
  X, 
  Server,
  Workflow,
  Send,
  Radio,
  KeyRound,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  QrCode,
  Building,
  Loader2
} from 'lucide-react'
import simlabLogo from './assets/simlab.png'
import frisscoSimlabLogo from './assets/frissco_simlab.png'
import heroImage from './assets/hero.png'
import './App.css'

const featureGroups = [
  {
    title: 'Interactive Topology Canvas Editor',
    icon: Globe,
    eyebrow: 'Design Workspace',
    visualLabel: 'Canvas Studio',
    accent: 'lavender',
    points: [
      'Responsive vector canvas for physical and logical network design.',
      'Router, host, and switch palette with configurable interfaces and subnet allocations.',
      'Custom link properties for bandwidth, link cost, and propagation delay.',
      'Drag-and-drop placement, align-to-grid, zoom, pan, and quick rename or subnet editing.',
    ],
  },
  {
    title: 'Visual Routing Protocols Simulator',
    icon: Workflow,
    eyebrow: 'Routing Intelligence',
    visualLabel: 'Protocol Replay',
    accent: 'blue',
    points: [
      'Step-by-step Dijkstra, Distance Vector, Link State, Bellman-Ford, Flooding, and Static Routing workflows.',
      'Convergence-focused visualizations for RIP-like and OSPF-like behavior.',
      'Clear path-computation storytelling for teaching routing decisions and failure handling.',
    ],
  },
  {
    title: 'Packet Injection & Analysis Suite',
    icon: Send,
    eyebrow: 'Packet Observatory',
    visualLabel: 'Traffic Trace',
    accent: 'peach',
    points: [
      'Inject ICMP, TCP, UDP, and routing packets between selected hosts.',
      'Tune payload, TTL, and source or destination IP details.',
      'Inspect routing tables, MAC learning tables, hop history, latency, and delivery outcomes.',
    ],
  },
  {
    title: '"What-If" Chaos Engineering Engine',
    icon: Activity,
    eyebrow: 'Resilience Testing',
    visualLabel: 'Failure Lab',
    accent: 'red',
    points: [
      'Monte Carlo stress simulation for large-scale network behavior exploration.',
      'Model random link failures, trunk congestion, and gateway crashes.',
      'Generate reliability findings for convergence time, bottlenecks, packet loss, and failure-prone paths.',
    ],
  },
  {
    title: 'Live Hybrid FRRouting/Docker Emulator',
    icon: Server,
    eyebrow: 'Real Emulation',
    visualLabel: 'FRR Bridge',
    accent: 'green',
    points: [
      'Swap mathematical routing models for real FRRouting-backed behavior.',
      'Spin up lightweight Dockerized routers for realistic protocol validation.',
      'Read actual Linux routing tables to inspect practical SDN outcomes.',
    ],
  },
  {
    title: 'ARQ Protocol Simulator',
    icon: Send,
    eyebrow: 'Reliability Protocols',
    visualLabel: 'ARQ Playback',
    accent: 'blue',
    points: [
      'Visualize Stop-and-Wait, Go-Back-N, and Selective Repeat.',
      'Inspect ACKs, timeouts, retransmissions, sliding windows, and out-of-order buffering.',
      'Inject controlled frame or ACK drops to teach recovery behavior.',
    ],
  },
  {
    title: 'MAC Layer Media Access Simulator',
    icon: Radio,
    eyebrow: 'Shared Medium Control',
    visualLabel: 'Collision View',
    accent: 'lavender',
    points: [
      'Simulate CSMA/CD with carrier sensing, collisions, jam signals, and exponential backoff.',
      'Demonstrate CSMA/CA wireless handshakes including RTS, CTS, DATA, and ACK timing.',
    ],
  },
  {
    title: 'Token-Based Network Simulator',
    icon: Cpu,
    eyebrow: 'Legacy Media Models',
    visualLabel: 'Token Flow',
    accent: 'peach',
    points: [
      'Animate token circulation for Token Ring and logical successor paths for Token Bus.',
      'Show token capture, busy frames, acknowledgement behavior, and token release.',
    ],
  },
  {
    title: 'Security & Product Licensing',
    icon: KeyRound,
    eyebrow: 'Commercial Controls',
    visualLabel: 'License Guard',
    accent: 'green',
    points: [
      'RSA-signed activation keys with embedded verification and expiry checks.',
      'Integrated activation dialog for license status, activation, and deactivation.',
      'Premium feature gating based on validated license metadata.',
    ],
  },
  {
    title: 'Reports & Exports',
    icon: FileText,
    eyebrow: 'Evidence Output',
    visualLabel: 'Export Center',
    accent: 'lavender',
    points: [
      'Export high-resolution PNG topology snapshots.',
      'Generate polished PDF reports covering nodes, links, interfaces, routing tables, and diagnostics.',
    ],
  },
]

const individualLicenseInr = 1843
const web3FormsAccessKey = 'ecdab183-c7d4-4321-bd74-bb6a1a240387'
const individualPaymentUrl = import.meta.env.VITE_RAZORPAY_PAYMENT_URL as string | undefined
const licenseIssueApiUrl = import.meta.env.VITE_LICENSE_ISSUE_API_URL as string | undefined

// Client-side routing helper type
type PurchaseView = 'landing' | 'purchase-success'

type IssuedLicense = {
  email?: string
  expiry?: string
  licenseKey: string
  user?: string
}

const getRegionalPricing = () => {
  return {
    amount: `Rs ${individualLicenseInr}`,
    suffix: 'one-time license',
    note: 'Flat rate in INR for all customers worldwide.',
    isIndia: true,
  }
}


function App() {
  // Navigation & Modals
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [copiedText, setCopiedText] = useState('')
  const [regionalPricing, setRegionalPricing] = useState(getRegionalPricing)
  const [activeFeature, setActiveFeature] = useState(0)
  const [purchaseView, setPurchaseView] = useState<PurchaseView>(() =>
    window.location.hash.startsWith('#/purchase-success') ? 'purchase-success' : 'landing'
  )
  // Checkout Modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [checkoutName, setCheckoutName] = useState('')
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutOrg, setCheckoutOrg] = useState('')
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')



  // 2. Protocol Labs Tabs State
  const [activeLab, setActiveLab] = useState<'arq' | 'csma' | 'tcp'>('arq')

  // ARQ Flow Control States
  const [arqStatus, setArqStatus] = useState<'idle' | 'sending' | 'dropped' | 'ack' | 'timeout'>('idle')
  const [arqPacketProgress, setArqPacketProgress] = useState(0)
  const [arqAckProgress, setArqAckProgress] = useState(0)
  const [arqSeqNum, setArqSeqNum] = useState(0)
  const [arqWillDrop, setArqWillDrop] = useState(false)
  const [arqLogs, setArqLogs] = useState<string[]>(['[ARQ] Click "Send Frame" to start transmission.'])

  // CSMA/CD States
  const [csmaAState, setCsmaAState] = useState<'idle' | 'transmitting' | 'collision' | 'backoff'>('idle')
  const [csmaBState, setCsmaBState] = useState<'idle' | 'transmitting' | 'collision' | 'backoff'>('idle')
  const [csmaTimerA, setCsmaTimerA] = useState(0)
  const [csmaTimerB, setCsmaTimerB] = useState(0)
  const [csmaCollision, setCsmaCollision] = useState(false)
  const [csmaLogs, setCsmaLogs] = useState<string[]>(['[CSMA] Shared medium idle. Transmit nodes to inspect collisions.'])

  // TCP Congestion States
  const [tcpCwnd, setTcpCwnd] = useState(1)
  const [tcpSsthresh, setTcpSsthresh] = useState(16)
  const [tcpPhase, setTcpPhase] = useState<'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery'>('Slow Start')
  const [tcpPoints, setTcpPoints] = useState<{ x: number; y: number; type?: 'loss' | 'timeout' | 'normal' }[]>([
    { x: 0, y: 1 }
  ])
  const [tcpLogs, setTcpLogs] = useState<string[]>(['[TCP] TCP Congestion simulator ready. Increment time steps to grow window.'])

  // 3. Chaos Engineering States
  const [linkFlap, setLinkFlap] = useState(15)
  const [packetLoss, setPacketLoss] = useState(5)
  const [deviceFail, setDeviceFail] = useState(2)
  const [reliabilityScore, setReliabilityScore] = useState(99.999)
  const [mtbfHours, setMtbfHours] = useState(720)
  const [chaosHistory, setChaosHistory] = useState<number[]>([15, 18, 14, 16, 15, 17, 19, 15, 14, 16])

  // 4. Security Terminal States
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Frissco Security Core v1.0.0 Activation Console',
    'Type "help" for a list of available security inspection routines.',
    ''
  ])
  const [isTampered, setIsTampered] = useState(false)

  // 5. Contact Form States
  const [contactForm, setContactForm] = useState({ name: '', email: '', org: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // References for Auto-scroll
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [terminalLines])

  useEffect(() => {
    setRegionalPricing(getRegionalPricing())
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFeature((current) => (current + 1) % featureGroups.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      setPurchaseView(window.location.hash.startsWith('#/purchase-success') ? 'purchase-success' : 'landing')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkoutName.trim() || !checkoutEmail.trim()) {
      setCheckoutError('Name and Email are required.')
      return
    }
    setCheckoutError('')
    setIsSubmittingCheckout(true)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3FormsAccessKey,
          subject: `[SimLab Order] Individual License Request - ${checkoutName}`,
          from_name: 'SimLab License Checkout',
          name: checkoutName,
          email: checkoutEmail,
          message: `Hello! A new license request order has been submitted for Frissco SimLab.

Customer Name: ${checkoutName}
Customer Email: ${checkoutEmail}
Organization: ${checkoutOrg || 'None'}

Order details:
- Plan: Individual License
- Price: Rs 1843 (Request submitted)`
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to submit order. Please try again.')
      }

      setCheckoutModalOpen(false)
      setCheckoutName('')
      setCheckoutEmail('')
      setCheckoutOrg('')
      
      window.location.hash = '#/purchase-success'
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setIsSubmittingCheckout(false)
    }
  }



  // ==========================================
  // Protocol Labs Simulator Code
  // ==========================================

  // 1. ARQ Flow Control Animation loop
  const startArqSim = () => {
    if (arqStatus !== 'idle') return
    setArqStatus('sending')
    setArqPacketProgress(0)
    setArqLogs(prev => [...prev, `[ARQ] Transmitting Frame #${arqSeqNum} (SeqNo: ${arqSeqNum % 2}).`])
  }

  const dropNextArq = () => {
    setArqWillDrop(true)
    setArqLogs(prev => [...prev, `[ARQ-Controller] Configured scheduler to inject single packet loss on next frame.`])
  }

  useEffect(() => {
    if (arqStatus !== 'sending') return
    const interval = setInterval(() => {
      setArqPacketProgress(p => {
        if (arqWillDrop && p >= 50) {
          clearInterval(interval)
          setArqStatus('dropped')
          setArqWillDrop(false)
          setArqLogs(logs => [...logs, `[ARQ] ⚠ Packet Collision / Link Drop at 50% link distance. Frame #${arqSeqNum} lost.`])
          
          // Timeout trigger
          setTimeout(() => {
            setArqLogs(logs => [...logs, `[ARQ] Timer Expired (3000ms)! No ACK received. Retransmitting.`])
            setArqStatus('idle')
            setTimeout(() => {
              setArqStatus('sending')
              setArqPacketProgress(0)
              setArqLogs(logs => [...logs, `[ARQ] Retransmitting Frame #${arqSeqNum}.`])
            }, 500)
          }, 2000)

          return p
        }

        if (p >= 100) {
          clearInterval(interval)
          setArqStatus('ack')
          setArqAckProgress(0)
          setArqLogs(logs => [...logs, `[ARQ] Frame #${arqSeqNum} received. Computing checksum... OK. Dispatching ACK.`])
          return 100
        }
        return p + 4
      })
    }, 40)
    return () => clearInterval(interval)
  }, [arqStatus, arqWillDrop])

  useEffect(() => {
    if (arqStatus !== 'ack') return
    const interval = setInterval(() => {
      setArqAckProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setArqStatus('idle')
          setArqLogs(logs => [...logs, `[ARQ] ACK received. Sequence slide successful. Slide window right.`])
          setArqSeqNum(s => s + 1)
          return 100
        }
        return p + 4
      })
    }, 40)
    return () => clearInterval(interval)
  }, [arqStatus])

  // 2. CSMA/CD collision simulation
  const startCsmaSim = (node: 'A' | 'B') => {
    if (node === 'A') {
      if (csmaAState !== 'idle') return
      setCsmaAState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node A senses medium: Idle. Starting transmission.`])
    } else {
      if (csmaBState !== 'idle') return
      setCsmaBState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node B senses medium: Idle. Starting transmission.`])
    }
  }

  // Handle collision logic
  useEffect(() => {
    if (csmaAState === 'transmitting' && csmaBState === 'transmitting' && !csmaCollision) {
      setCsmaCollision(true)
      setCsmaAState('collision')
      setCsmaBState('collision')
      setCsmaLogs(prev => [
        ...prev,
        `[CSMA] 💥 COLLISION DETECTED on shared bus! Transmitting jam signals...`
      ])

      // Backoff calculator
      setTimeout(() => {
        setCsmaCollision(false)
        const backoffA = Math.floor(Math.random() * 4) + 2
        const backoffB = Math.floor(Math.random() * 4) + 2
        setCsmaTimerA(backoffA)
        setCsmaTimerB(backoffB)
        setCsmaAState('backoff')
        setCsmaBState('backoff')
        setCsmaLogs(prev => [
          ...prev,
          `[CSMA] Backoff algorithm (Exponential): Node A backoff: ${backoffA}s, Node B backoff: ${backoffB}s.`
        ])
      }, 1000)
    }
  }, [csmaAState, csmaBState])

  // Backoff timers countdown
  useEffect(() => {
    let timer: any
    if (csmaAState === 'backoff' && csmaTimerA > 0) {
      timer = setTimeout(() => setCsmaTimerA(t => t - 1), 1000)
    } else if (csmaAState === 'backoff' && csmaTimerA === 0) {
      setCsmaAState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node A backoff completed. Retransmitting packet.`])
      setTimeout(() => {
        setCsmaAState('idle')
        setCsmaLogs(prev => [...prev, `[CSMA] Node A packet sent successfully.`])
      }, 1500)
    }
    return () => clearTimeout(timer)
  }, [csmaAState, csmaTimerA])

  useEffect(() => {
    let timer: any
    if (csmaBState === 'backoff' && csmaTimerB > 0) {
      timer = setTimeout(() => setCsmaTimerB(t => t - 1), 1000)
    } else if (csmaBState === 'backoff' && csmaTimerB === 0) {
      setCsmaBState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node B backoff completed. Retransmitting packet.`])
      setTimeout(() => {
        setCsmaBState('idle')
        setCsmaLogs(prev => [...prev, `[CSMA] Node B packet sent successfully.`])
      }, 1500)
    }
    return () => clearTimeout(timer)
  }, [csmaBState, csmaTimerB])

  // 3. TCP Congestion step
  const stepTcp = () => {
    const nextX = tcpPoints.length
    let nextCwnd = tcpCwnd
    let nextPhase = tcpPhase

    if (tcpPhase === 'Slow Start') {
      nextCwnd = Math.min(64, tcpCwnd * 2)
      setTcpLogs(prev => [...prev, `[TCP] Slow Start: Doubling CWND to ${nextCwnd} (ssthresh: ${tcpSsthresh}).`])
      
      if (nextCwnd >= tcpSsthresh) {
        nextPhase = 'Congestion Avoidance'
        setTcpLogs(prev => [...prev, `[TCP] CWND reached ssthresh (${tcpSsthresh}). Switching to Congestion Avoidance (linear growth).`])
      }
    } else {
      nextCwnd = Math.min(64, tcpCwnd + 1)
      setTcpLogs(prev => [...prev, `[TCP] Congestion Avoidance: CWND increased linearly to ${nextCwnd}.`])
    }

    setTcpCwnd(nextCwnd)
    setTcpPhase(nextPhase)
    setTcpPoints(prev => [...prev, { x: nextX, y: nextCwnd, type: 'normal' }])
  }

  const triggerTcpLoss = (isTimeout = false) => {
    const nextX = tcpPoints.length
    let nextCwnd = 1
    let nextSsthresh = Math.max(2, Math.floor(tcpCwnd / 2))
    let nextPhase: 'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery' = 'Slow Start'

    if (isTimeout) {
      nextCwnd = 1
      nextPhase = 'Slow Start'
      setTcpLogs(prev => [
        ...prev, 
        `[TCP] ☠ Timeout detected! Retransmission timer expired. Setting ssthresh = ${nextSsthresh}, resetting CWND = 1.`
      ])
    } else {
      nextCwnd = nextSsthresh
      nextPhase = 'Congestion Avoidance'
      setTcpLogs(prev => [
        ...prev, 
        `[TCP] ⚠ Triple Duplicate ACKs detected (fast loss). Halving CWND to ${nextCwnd}, setting ssthresh = ${nextSsthresh}.`
      ])
    }

    setTcpCwnd(nextCwnd)
    setTcpSsthresh(nextSsthresh)
    setTcpPhase(nextPhase)
    setTcpPoints(prev => [...prev, { x: nextX, y: nextCwnd, type: isTimeout ? 'timeout' : 'loss' }])
  }

  const resetTcp = () => {
    setTcpCwnd(1)
    setTcpSsthresh(16)
    setTcpPhase('Slow Start')
    setTcpPoints([{ x: 0, y: 1 }])
    setTcpLogs(['[TCP] Congestion engine reset. Starting Slow Start.'])
  }

  // ==========================================
  // Chaos Dashboard Sliders & Live Math
  // ==========================================
  useEffect(() => {
    // Math to compute reliability indexes based on stress vectors
    const baseScore = 99.999
    const penalty = (linkFlap * 0.003) + (packetLoss * 0.05) + (deviceFail * 0.8)
    const score = Math.max(12.456, baseScore - penalty)
    setReliabilityScore(parseFloat(score.toFixed(3)))

    // MTBF Calculation
    const mtbf = Math.max(0.5, 720 / (1 + (linkFlap * 0.1) + (packetLoss * 0.3) + (deviceFail * 1.5)))
    setMtbfHours(parseFloat(mtbf.toFixed(1)))

    // Update history for the mini-chart
    const nextHistory = [...chaosHistory.slice(1), Math.round(penalty * 1.5 + 10)]
    setChaosHistory(nextHistory)
  }, [linkFlap, packetLoss, deviceFail])

  // Get status color for chaos index
  const getChaosStatus = () => {
    if (reliabilityScore > 99.8) return { label: 'HEALTHY', color: 'green' }
    if (reliabilityScore > 95.0) return { label: 'DEGRADED', color: 'amber' }
    return { label: 'CRITICAL STRESS', color: 'red' }
  }

  // ==========================================
  // Terminal Emulator Engine
  // ==========================================
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const input = terminalInput.trim().toLowerCase()
    if (!input) return

    let responses = [`$ simlab-admin --verify ${input}`]

    if (input === 'help') {
      responses = [
        ...responses,
        'Available routines:',
        '  verify-license    - Cryptographic asymmetric activation test',
        '  tamper-audit      - System anti-tamper and rollback detection logs',
        '  obfuscation-check - Check pyarmor local engine integrity',
        '  clear             - Clear display logs'
      ]
    } else if (input === 'clear') {
      setTerminalLines([])
      setTerminalInput('')
      return
    } else if (input === 'verify-license') {
      responses = [
        ...responses,
        '[Verification] Reading activation key payload from locally cached license...',
        '[Verification] Extracting public signature (RSA-2048)...',
        '[Verification] Decrypting signature block against internal public key...',
        '[Verification] OK. Key matches fingerprint: SHA256:4d6163...6e746f7368',
        '[Verification] SUCCESS: Licensing authority successfully verified.'
      ]
    } else if (input === 'tamper-audit') {
      if (isTampered) {
        responses = [
          ...responses,
          '[Audit] ERROR: System clock integrity check FAILED!',
          '[Audit] File timestamp: 2026-06-12T17:00:05',
          '[Audit] Checked system clock: 2024-01-01T00:00:00 (Backdated by 2.5 years)',
          '[Audit] CRITICAL: Clock rollback detected! Licensing protection locked.'
        ]
      } else {
        responses = [
          ...responses,
          '[Audit] Inspecting system telemetry logs...',
          '[Audit] Checking persistent timestamp log file...',
          '[Audit] Last recorded run: 2026-06-12T16:55:12',
          '[Audit] Current system clock: 2026-06-12T17:00:05',
          '[Audit] OK. Clock rollback check completed (Time delta: +4 min 53 sec).'
        ]
      }
    } else if (input === 'obfuscation-check') {
      responses = [
        ...responses,
        '[Integrity] Analyzing simulator runtime files...',
        '[Integrity] PyArmor runtime checks: OK',
        '[Integrity] Bytecode verification: checksum matches build specification.',
        '[Integrity] Anti-debugging hook check: ACTIVE.',
        '[Integrity] PyInstaller bundle configuration: verified safe.'
      ]
    } else {
      responses = [
        ...responses,
        `Command not recognized: "${input}". Type "help" for a list of system diagnostics.`
      ]
    }

    setTerminalLines(prev => [...prev, ...responses, ''])
    setTerminalInput('')
  }

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3FormsAccessKey,
          subject: `SimLab contact form inquiry from ${contactForm.name}`,
          from_name: contactForm.name,
          name: contactForm.name,
          email: contactForm.email,
          organization: contactForm.org,
          message: contactForm.message,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to send your message right now.')
      }

      setFormSubmitted(true)
      setContactForm({ name: '', email: '', org: '', message: '' })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to send your message right now.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const currentFeature = featureGroups[activeFeature]

  const handleFeatureStep = (direction: 'prev' | 'next') => {
    setActiveFeature((current) => {
      if (direction === 'prev') {
        return current === 0 ? featureGroups.length - 1 : current - 1
      }
      return (current + 1) % featureGroups.length
    })
  }

  if (purchaseView === 'purchase-success') {
    return (
      <section className="container purchase-success-page">
        <div className="purchase-success-shell card" style={{ textAlign: 'center', alignItems: 'center', padding: '60px 40px', gap: '32px' }}>
          <div className="feature-icon-wrapper" style={{ margin: '0 auto', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-green)', color: 'var(--accent-green)', background: 'rgba(166, 227, 161, 0.1)', boxShadow: '0 0 20px rgba(166, 227, 161, 0.2)' }}>
            <Check size={32} />
          </div>
          
          <span className="badge badge-green" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purchase Successful</span>
          
          <h1 className="purchase-success-title" style={{ margin: '0', fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #fff 0%, var(--text-dim) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Thank you for purchasing Frissco SimLab
          </h1>
          
          <p className="purchase-success-copy" style={{ fontSize: '1.15rem', lineHeight: '1.6', color: 'var(--text-primary)', maxWidth: '600px', margin: '0 auto' }}>
            You will get your download through your mail within <strong>24 Hours</strong>.
          </p>

          <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '20px auto 0',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--surface-0)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Mail size={24} style={{ color: 'var(--accent-lavender)' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>For further queries, contact:</span>
            <a href="mailto:thefrisscoteamofficial@gmail.com" style={{ fontSize: '1.1rem', color: 'var(--accent-lavender)', fontWeight: '600', textDecoration: 'none', borderBottom: '1px dashed var(--accent-lavender)', paddingBottom: '2px' }}>
              thefrisscoteamofficial@gmail.com
            </a>
          </div>

          <div className="purchase-success-actions" style={{ marginTop: '12px' }}>
            <a href="#" className="btn btn-primary">Back to site</a>
            <a href="#contact" className="btn btn-outline">Need help?</a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* 1. Header Navigation */}
      <header className="nav-header">
        <div className="container nav-container">
          <a href="#" className="brand">
            <img src={frisscoSimlabLogo} alt="Frissco SimLab" style={{ height: '36px' }} />
          </a>
          <nav>
            <ul className="nav-links">
              <li><a href="#audience">Overview</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#labs">Protocol Labs</a></li>
              <li><a href="#chaos">Chaos Engine</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><button onClick={() => setDownloadModalOpen(true)} className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Download CLI</button></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Ambient background decorative elements */}
      <div className="glow-ambient-2"></div>

      {/* 2. Hero Section */}
      <section className="hero-section-wrapper" id="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="badge badge-lavender hero-badge-pulse">
              <span className="hero-badge-dot"></span>
              Version 1.0.0 — Now Available
            </span>
          </div>

          <h1 className="hero-title">
            Simulate Networks.<br />
            <span className="hero-title-gradient">Verify Protocols.</span><br />
            Ship with Confidence.
          </h1>

          <p className="hero-subtitle">
            Frissco SimLab bridges the gap between abstract academic network concepts and production SDN routing validations. Build, stress-test, and verify complex topologies — visually, in real-time.
          </p>

          <div className="hero-actions">
            <button onClick={() => setDownloadModalOpen(true)} className="btn btn-primary hero-btn-primary">
              <Download size={18} />
              Get Started — Free
            </button>
            <a href="#contact" className="btn btn-secondary">
              Request Enterprise License
            </a>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat-chip">
              <Activity size={14} />
              <span>Real-Time Simulation</span>
            </div>
            <div className="hero-stat-chip">
              <Shield size={14} />
              <span>SDN Validated</span>
            </div>
            <div className="hero-stat-chip">
              <Cpu size={14} />
              <span>Protocol Accurate</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          {/* Animated network topology background */}
          <div className="hero-network-canvas">
            <svg className="hero-network-svg" viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Connection lines */}
              <line x1="240" y1="200" x2="120" y2="100" stroke="rgba(180,190,254,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" />
              <line x1="240" y1="200" x2="360" y2="100" stroke="rgba(180,190,254,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '0.5s'}} />
              <line x1="240" y1="200" x2="80" y2="280" stroke="rgba(137,180,250,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '1s'}} />
              <line x1="240" y1="200" x2="400" y2="290" stroke="rgba(137,180,250,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '1.5s'}} />
              <line x1="240" y1="200" x2="240" y2="60" stroke="rgba(203,166,247,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '0.3s'}} />
              <line x1="120" y1="100" x2="80" y2="280" stroke="rgba(180,190,254,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '0.7s'}} />
              <line x1="360" y1="100" x2="400" y2="290" stroke="rgba(180,190,254,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '1.2s'}} />
              <line x1="80" y1="280" x2="240" y2="350" stroke="rgba(137,180,250,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '0.9s'}} />
              <line x1="400" y1="290" x2="240" y2="350" stroke="rgba(137,180,250,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '1.7s'}} />

              {/* Outer nodes */}
              <circle cx="120" cy="100" r="10" fill="rgba(180,190,254,0.12)" stroke="rgba(180,190,254,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" />
              <circle cx="120" cy="100" r="4" fill="var(--accent-lavender)" />

              <circle cx="360" cy="100" r="10" fill="rgba(137,180,250,0.12)" stroke="rgba(137,180,250,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '0.4s'}} />
              <circle cx="360" cy="100" r="4" fill="var(--accent-blue)" />

              <circle cx="80" cy="280" r="10" fill="rgba(203,166,247,0.12)" stroke="rgba(203,166,247,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '0.8s'}} />
              <circle cx="80" cy="280" r="4" fill="var(--accent-mauve)" />

              <circle cx="400" cy="290" r="10" fill="rgba(180,190,254,0.12)" stroke="rgba(180,190,254,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '1.2s'}} />
              <circle cx="400" cy="290" r="4" fill="var(--accent-lavender)" />

              <circle cx="240" cy="60" r="8" fill="rgba(166,227,161,0.12)" stroke="rgba(166,227,161,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '1.6s'}} />
              <circle cx="240" cy="60" r="3" fill="var(--accent-green)" />

              <circle cx="240" cy="350" r="8" fill="rgba(250,179,135,0.12)" stroke="rgba(250,179,135,0.35)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '2s'}} />
              <circle cx="240" cy="350" r="3" fill="var(--accent-peach)" />

              {/* Centre hub ring */}
              <circle cx="240" cy="200" r="28" fill="rgba(180,190,254,0.06)" stroke="rgba(180,190,254,0.25)" strokeWidth="1.5" />
              <circle cx="240" cy="200" r="18" fill="rgba(180,190,254,0.08)" stroke="rgba(180,190,254,0.35)" strokeWidth="1" />
              <circle cx="240" cy="200" r="7" fill="var(--accent-lavender)" className="hero-hub-core" />
            </svg>

            {/* Floating ping chips */}
            <div className="hero-ping-chip hero-ping-chip-1">
              <span className="hero-ping-dot green"></span>
              <span>Router A — Online</span>
            </div>
            <div className="hero-ping-chip hero-ping-chip-2">
              <span className="hero-ping-dot blue"></span>
              <span>Link Latency 2ms</span>
            </div>
            <div className="hero-ping-chip hero-ping-chip-3">
              <span className="hero-ping-dot mauve"></span>
              <span>Packets: 4,821</span>
            </div>
          </div>

          {/* Logo card floating over canvas */}
          <div className="hero-logo-float-card">
            <div className="hero-logo-glow"></div>
            <img src={simlabLogo} alt="Frissco SimLab Logo" className="hero-logo-img" />
            <div className="hero-logo-meta">
              <h3>Frissco SimLab</h3>
              <p>Network Simulation Suite</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container" id="audience">
        <div className="section-header section-header-left">
          <span className="badge badge-blue">Software Overview</span>
          <h2>What Frissco SimLab does</h2>
          <p>
            Frissco SimLab is a network simulation and protocol-learning platform built for students, instructors,
            researchers, and engineering teams. It helps teams design topologies, visualize routing behavior,
            inject packets, test failure scenarios, and validate software-defined networking decisions in one guided environment.
          </p>
        </div>

        <div className="overview-grid">
          <div className="card overview-card">
            <h3>Built for understanding and validation</h3>
            <p>
              Use SimLab to move from theory to proof. You can model networks visually, observe protocol behavior step by step,
              run experiments under stress, and export evidence for reports, teaching, or engineering review.
            </p>
          </div>
          <div className="card overview-card">
            <h3>From classroom labs to production planning</h3>
            <p>
              The platform supports everything from academic protocol demonstrations to realistic FRRouting and Docker-backed
              emulation, making it useful for both learning environments and professional network validation workflows.
            </p>
          </div>
        </div>
      </section>

      <section className="container" id="features" style={{ borderTop: '1px solid var(--surface-0)' }}>
        <div className="section-header">
          <span className="badge badge-lavender">Core Feature Showcase</span>
          <h2>Explore the platform like a product demo</h2>
          <p>
            Browse the core capabilities as a visual carousel. Each slide highlights one part of the SimLab workflow
            so visitors can quickly understand what the software does in practice.
          </p>
        </div>

        <div className={`feature-showcase accent-${currentFeature.accent}`}>
          <div className="feature-showcase-shell">
            <div
              className="feature-showcase-track"
              style={{ transform: `translateX(-${activeFeature * 100}%)` }}
            >
              {featureGroups.map((feature, index) => {
                const SlideIcon = feature.icon

                return (
                  <article key={feature.title} className={`feature-slide accent-${feature.accent}`}>
                    <div className="feature-showcase-visual">
                      <div className="feature-showcase-frame">
                        <img src={heroImage} alt={feature.title} className="feature-showcase-image" />
                        <div className="feature-showcase-overlay"></div>

                        <div className="feature-showcase-topbar">
                          <span className="badge badge-blue">{feature.eyebrow}</span>
                          <span className="feature-showcase-count">
                            {String(index + 1).padStart(2, '0')} / {String(featureGroups.length).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="feature-showcase-floating feature-showcase-floating-primary">
                          <SlideIcon size={18} />
                          <span>{feature.visualLabel}</span>
                        </div>
                        <div className="feature-showcase-floating feature-showcase-floating-secondary">
                          <span className="feature-pulse-dot"></span>
                          <span>Interactive showcase</span>
                        </div>
                        <div className="feature-showcase-floating feature-showcase-floating-tertiary">
                          <span>{feature.points.length} highlights</span>
                        </div>
                      </div>
                    </div>

                    <div className="feature-showcase-copy">
                      <div className="feature-showcase-copy-head">
                        <div className="feature-icon-wrapper">
                          <SlideIcon size={22} />
                        </div>
                        <div>
                          <span className="feature-eyebrow">{feature.eyebrow}</span>
                          <h3>{feature.title}</h3>
                        </div>
                      </div>

                      <ul className="feature-list">
                        {feature.points.map((point) => (
                          <li key={point}>
                            <Check size={16} className="text-accent" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <div className="feature-carousel-controls">
            <button type="button" className="feature-nav-btn" onClick={() => handleFeatureStep('prev')} aria-label="Previous feature">
              <ChevronLeft size={18} />
            </button>
            <div className="feature-dots" aria-label="Feature slide selectors">
              {featureGroups.map((feature, index) => (
                <button
                  key={feature.title}
                  type="button"
                  className={`feature-dot-btn ${index === activeFeature ? 'active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                  aria-label={`Show ${feature.title}`}
                />
              ))}
            </div>
            <button type="button" className="feature-nav-btn" onClick={() => handleFeatureStep('next')} aria-label="Next feature">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="feature-rail">
            {featureGroups.map((feature, index) => {
              const RailIcon = feature.icon
              return (
                <button
                  key={feature.title}
                  type="button"
                  className={`feature-rail-item ${index === activeFeature ? 'active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                >
                  <RailIcon size={16} />
                  <span>{feature.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container" id="pricing" style={{ borderTop: '1px solid var(--surface-0)' }}>
        <div className="section-header">
          <span className="badge badge-lavender">Licensing Plans</span>
          <h2>Simple licensing for solo users and organizations</h2>
          <p>Start with the free essentials, upgrade for the full individual toolkit, or contact sales for multi-user and institutional licensing.</p>
        </div>

        <div className="pricing-grid">
          <div className="card pricing-card">
            <div>
              <span className="badge badge-green">Free</span>
              <h3 style={{ marginTop: '8px' }}>Free Plan</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                A lightweight starting point for learning the interface and experimenting with core network design workflows.
              </p>

              <div className="price-box">
                <span className="price-num">$0</span>
                <span className="price-period">/ forever</span>
              </div>
              <p className="pricing-note">Best for trying the basics before moving into advanced labs and analysis.</p>

              <ul className="pricing-features">
                <li><Check size={16} className="text-accent" /> Topology editor canvas</li>
                <li><Check size={16} className="text-accent" /> Router, host, and switch placement</li>
                <li><Check size={16} className="text-accent" /> Basic path finding and shortest-path exploration</li>
              </ul>
            </div>

            <button onClick={() => setDownloadModalOpen(true)} className="btn btn-outline" style={{ width: '100%' }}>
              Start Free
            </button>
          </div>

          <div className="card pricing-card popular">
            <div className="popular-badge">INDIVIDUAL</div>
            <div>
              <span className="badge badge-blue">{regionalPricing.isIndia ? 'India Pricing' : 'International Pricing'}</span>
              <h3 style={{ marginTop: '8px' }}>Individual License</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                Best for self-learning, research, demos, and single-user network simulation workstations.
              </p>
              
              <div className="price-box">
                <span className="price-num">{regionalPricing.amount}</span>
                <span className="price-period">/ {regionalPricing.suffix}</span>
              </div>
              <p className="pricing-note">{regionalPricing.note}</p>

              <ul className="pricing-features">
                <li><Check size={16} className="text-accent" /> Full access to the core simulation suite</li>
                <li><Check size={16} className="text-accent" /> Visual routing, packet analysis, and protocol labs</li>
                <li><Check size={16} className="text-accent" /> Chaos testing, exports, and reporting workflows</li>
                <li><Check size={16} className="text-accent" /> Ideal for personal labs, students, and independent engineers</li>
              </ul>
            </div>

            <button onClick={() => {
              setCheckoutName('')
              setCheckoutEmail('')
              setCheckoutOrg('')
              setCheckoutError('')
              setCheckoutModalOpen(true)
            }} className="btn btn-secondary" style={{ width: '100%' }}>
              Buy Individual License
            </button>
          </div>

          <div className="card pricing-card">
            <div>
              <span className="badge badge-lavender">Custom Quote</span>
              <h3 style={{ marginTop: '8px' }}>Team, Educational or Enterprise License</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                For classrooms, labs, departments, and organizations that need multi-user licensing, onboarding, or custom support.
              </p>
              
              <div className="price-box">
                <span className="price-num">Contact Sales</span>
              </div>

              <ul className="pricing-features">
                <li><Check size={16} className="text-accent" /> Multi-seat licensing for institutions and teams</li>
                <li><Check size={16} className="text-accent" /> Educational, departmental, and enterprise procurement support</li>
                <li><Check size={16} className="text-accent" /> Deployment guidance for classroom or organizational rollout</li>
                <li><Check size={16} className="text-accent" /> Commercial support and custom engagement options</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <a href="#contact" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                Contact Sales
              </a>
              <a href="#contact" className="btn btn-outline" style={{ width: '100%', textAlign: 'center' }}>
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Contact & Inquiry Form */}
      <section className="container" id="contact" style={{ borderTop: '1px solid var(--surface-0)', paddingBottom: '120px' }}>
        <div className="section-header" style={{ marginBottom: '40px' }}>
          <span className="badge badge-blue">Get in Touch</span>
          <h2>Contact the Frissco Team</h2>
          <p>Need evaluation trials, custom quotes, or have academic support questions? Write us a message.</p>
        </div>

        {formSubmitted ? (
          <div className="card text-center" style={{ maxWidth: '500px', margin: '0 auto', padding: '48px 32px' }}>
            <div className="feature-icon-wrapper" style={{ margin: '0 auto 16px', color: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>
              <Check size={24} />
            </div>
            <h3>Message Transmitted</h3>
            <p className="mt-4" style={{ marginBottom: '24px' }}>
              Your inquiry has been successfully dispatched to the Frissco support desk. A representative will contact you at your provided email.
            </p>
            <button onClick={() => { setFormSubmitted(false); setFormError('') }} className="btn btn-outline btn-sm">Send another message</button>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                required 
                value={contactForm.name} 
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} 
                className="form-input" 
                placeholder="Dr. Evelyn Vance"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                required 
                value={contactForm.email} 
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} 
                className="form-input" 
                placeholder="evance@university.edu"
              />
            </div>

            <div className="form-group">
              <label htmlFor="org">Organization</label>
              <input 
                type="text" 
                id="org" 
                value={contactForm.org} 
                onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })} 
                className="form-input" 
                placeholder="Stanford University"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Inquiry Details</label>
              <textarea 
                id="message" 
                required 
                rows={4} 
                value={contactForm.message} 
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} 
                className="form-textarea" 
                placeholder="We would like to request a 14-day evaluation license of the hybrid emulating software for our lab class..."
              ></textarea>
            </div>

            {formError && (
              <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem' }}>{formError}</p>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={formSubmitting}>
              <Mail size={16} /> {formSubmitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        )}
      </section>

      {/* 9. Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="brand">
                <img src={simlabLogo} alt="Frissco SimLab" />
                <span>Frissco SimLab</span>
              </a>
              <p>
                Advanced, interactive SDN routing, network decay, and protocol lab emulation environment.
              </p>
            </div>

            <div className="footer-column">
              <h4>Documentation</h4>
              <ul>
                <li><a href="https://simlab.frissco.net" target="_blank" rel="noopener noreferrer">Official Site <ExternalLink size={12} style={{ display: 'inline', marginLeft: '2px' }} /></a></li>
                <li><a href="#audience">Overview</a></li>
                <li><a href="#labs">Integrated Laboratories</a></li>
                <li><a href="#security">Anti-Tampering Telemetry</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Support & Contact</h4>
              <ul>
                <li><a href="mailto:thefrisscoteamofficial@gmail.com">thefrisscoteamofficial@gmail.com</a></li>
                <li><a href="mailto:sales@frissco.net">sales@frissco.net</a></li>
                <li><a href="https://simlab.frissco.net/support">Help Desk</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Frissco Inc. All rights reserved. Intellectual property protections apply.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 10. CLI Download Dialog Modal */}
      {downloadModalOpen && (
        <div className="modal-overlay" onClick={() => setDownloadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDownloadModalOpen(false)}>
              <X size={20} />
            </button>
            
            <span className="badge badge-lavender" style={{ marginBottom: '12px' }}>Download Terminal Bundle</span>
            <h3 style={{ marginBottom: '16px' }}>Installing Frissco SimLab</h3>
            <p style={{ fontSize: '0.95rem', marginBottom: '24px', color: 'var(--text-muted)' }}>
              Get started quickly with the lightweight native installer CLI. Run these scripts in your terminal to unpack the visual laboratory.
            </p>

            <div className="install-tabs">
              {/* Option 1: Standard installation */}
              <div className="install-comment"># Option A: Standard User Mode installation (Recommended)</div>
              <div className="install-terminal">
                <button 
                  onClick={() => copyToClipboard('./install.sh', 'std')} 
                  className="copy-btn"
                >
                  {copiedText === 'std' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="install-command">./install.sh</div>
              </div>

              {/* Option 2: System-wide installation */}
              <div className="install-comment" style={{ marginTop: '20px' }}># Option B: System-wide installation (Requires privileges)</div>
              <div className="install-terminal">
                <button 
                  onClick={() => copyToClipboard('sudo ./install.sh', 'sys')} 
                  className="copy-btn"
                >
                  {copiedText === 'sys' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="install-command">sudo ./install.sh</div>
              </div>

              {/* Option 3: Automated installation */}
              <div className="install-comment" style={{ marginTop: '20px' }}># Option C: Fully automated non-interactive install</div>
              <div className="install-terminal">
                <button 
                  onClick={() => copyToClipboard('./install.sh --yes', 'auto')} 
                  className="copy-btn"
                >
                  {copiedText === 'auto' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="install-command">./install.sh --yes</div>
              </div>
            </div>

            <div style={{ marginTop: '28px', fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              Need help? View our <a href="https://simlab.frissco.net/docs" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Installation Documentation</a>.
            </div>
          </div>
        </div>
      )}

      {/* 11. Custom Checkout Payment Gateway Modal */}
      {checkoutModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmittingCheckout && setCheckoutModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close" disabled={isSubmittingCheckout} onClick={() => setCheckoutModalOpen(false)}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="badge badge-blue">Individual License</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Request Form</span>
            </div>

            <h3 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>Request SimLab License</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '20px', color: 'var(--text-dim)' }}>
              Enter your details below to request your individual license key. Your activation key and build links will be dispatched to this email.
            </p>

            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="chkName">Full Name</label>
                  <input 
                    type="text" 
                    id="chkName" 
                    required 
                    value={checkoutName} 
                    onChange={(e) => setCheckoutName(e.target.value)} 
                    className="form-input" 
                    placeholder="e.g. Sidharth"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="chkEmail">Email Address</label>
                  <input 
                    type="email" 
                    id="chkEmail" 
                    required 
                    value={checkoutEmail} 
                    onChange={(e) => setCheckoutEmail(e.target.value)} 
                    className="form-input" 
                    placeholder="e.g. sid@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="chkOrg">Organization / University (Optional)</label>
                  <input 
                    type="text" 
                    id="chkOrg" 
                    value={checkoutOrg} 
                    onChange={(e) => setCheckoutOrg(e.target.value)} 
                    className="form-input" 
                    placeholder="e.g. Stanford University"
                  />
                </div>

                <div style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--surface-0)', 
                  borderRadius: '10px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>License Cost</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-heading)' }}>Rs 1,843</span>
                </div>

                {checkoutError && (
                  <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', margin: '0' }}>{checkoutError}</p>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isSubmittingCheckout}>
                  {isSubmittingCheckout ? 'Submitting Request...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default App
