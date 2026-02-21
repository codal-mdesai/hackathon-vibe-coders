// Share view — implemented in S10/S11
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-zinc-400 text-sm">Share link</p>
        <p className="text-zinc-600 font-mono text-xs">{token}</p>
        <p className="text-zinc-600 text-xs">Full implementation in S10/S11</p>
      </div>
    </div>
  )
}
