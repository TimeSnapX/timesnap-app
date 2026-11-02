// "Time = Value" palette: deep navy ink + warm gold. The stock `gray` and `indigo`
// scales are remapped so every screen picks up the new look with unchanged markup.
const ink = { 50:'#F6F7FB',100:'#EEF1F7',200:'#DCE2EE',300:'#C3CBDD',400:'#A3AEC8',500:'#8792AE',600:'#3A4766',700:'#25314F',800:'#18223B',900:'#101830',950:'#080D1C' };
const gold = { 50:'#FFF9EB',100:'#FEF0C7',200:'#FCE29A',300:'#F9D06A',400:'#F2BC4B',500:'#E5A632',600:'#D4922A',700:'#B07420',800:'#7A5216',900:'#3B2A0E',950:'#21170A' };
export default {
  content: ['./index.html', './*.tsx', './pages/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: { gray: ink, indigo: gold, ink, gold, purple: { 500: '#C9862B' } },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'Roboto', 'sans-serif'],
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
      },
      boxShadow: { glow: '0 10px 40px -10px rgba(229,166,50,0.45)', card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.6)' },
      keyframes: { rise: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } } },
      animation: { rise: 'rise .35s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [],
};
