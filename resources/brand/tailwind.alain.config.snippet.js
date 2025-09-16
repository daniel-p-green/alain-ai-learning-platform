/** ALAIN Tailwind Tokens Snippet (v1.0) */
export default {
  theme: {
    extend: {
      colors: {
        'alain-blue': 'var(--alain-blue)',
        'alain-yellow': 'var(--alain-yellow)',
        'alain-stroke': 'var(--alain-stroke)',
        'alain-navy-print': 'var(--alain-navy-print)',
        'alain-navy-print-alt': 'var(--alain-navy-print-alt)',
        'black-900': 'var(--black-900)',
        'white': 'var(--white)'
      },
      fontFamily: {
        montserrat: ['Montserrat', 'ui-sans-serif', 'system-ui'],
        inter: ['Inter', 'ui-sans-serif', 'system-ui'],
        'league-spartan': ['League Spartan', 'ui-sans-serif', 'system-ui']
      },
      fontSize: {
        h1: ['40px', { lineHeight: '44px', letterSpacing: '-0.01em' }],
        h2: ['32px', { lineHeight: '38px', letterSpacing: '-0.01em' }],
        h3: ['24px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
        body: ['18px', { lineHeight: '28px' }],
        small: ['14px', { lineHeight: '22px' }]
      }
    }
  }
}

