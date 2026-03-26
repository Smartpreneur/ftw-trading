export function SolutionFooter() {
  return (
    <footer className="text-center text-sm text-muted-foreground pt-6 pb-3">
      Solution provided by{' '}
      <a
        href="https://kuehn.it"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:opacity-80 transition-opacity"
      >
        <span className="text-foreground">Kuehn</span>
        <span style={{ color: '#0071e3' }}>.IT</span>
      </a>
    </footer>
  )
}
