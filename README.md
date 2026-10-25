# adxcal.com Full Clone

A complete, self-contained clone of [adxcal.com](https://www.adxcal.com/) featuring all **218+ calculators**, identical responsive design and styling, local assets, instant live search, and interactive calculation engines.

---

## 🌟 Highlights & Features

1. **All 218+ Calculators Cloned**:
   - **Financial**: Mortgage, Loan, Auto Loan, Interest, Payment, Retirement, Amortization, Investment, Currency, Inflation, Income Tax, Compound Interest, Salary, 401K, Sales Tax, Savings, Rent, Estate Tax, Annuity, Credit Card, CD, Mutual Fund, Roth IRA, IRA, Real Estate, ROI, APR, FHA, VA Mortgage, HELOC, etc.
   - **Fitness & Health**: BMI, Calorie, Body Fat, BMR, Macro, Ideal Weight, Pregnancy, Due Date, Pace, Army Body Fat, Carbohydrates, Lean Body Mass, Calories Burned, Target Heart Rate, Protein, TDEE, etc.
   - **Math**: Scientific, Fraction, Percentage, Triangle, Volume, Standard Deviation, Random Number Generator, Binary, Hex, Quadratic Formula, Slope, Log, Area, Probability, Statistics, Matrix, Pythagorean Theorem, etc.
   - **Other**: Age, Date, Time, Hours, GPA, Grade, Concrete, Subnet, Password Generator, Unit Conversion, Fuel Cost, Voltage Drop, Square Footage, Time Zone, Dice Roller, Shoe Size, Tip, etc.

2. **100% Local & Self-Contained**:
   - Zero reliance on external CDNs or third-party ad networks.
   - All CSS stylesheets (`/style.css`, `/css/sci.css`), JavaScript libraries (`common.js`, `scientific3.js`, `conversion.js`, `loannew.js`, `calendardateinput.js`), and SVG/raster images are served locally.
   - Google tag managers and ads stripped for clean, blazing-fast performance.

3. **Interactive Live Calculation Engine (`/js/calcs-live.js`)**:
   - Instant calculation on input or form submission without requiring full page reloads.
   - Accurate formulas for Mortgage, Loan, Auto Loan, BMI, Calories/BMR, Age, Percentage, Interest & Compound Interest, Password Generator, Subnet Masking, Fractions, and more.
   - Full scientific calculator runtime with trigonometric functions (sin, cos, tan, asin, acos, atan), logarithms (ln, log), powers, roots, factorials, memory registers (M+, M-, MR, MC), and degree/radian mode.

4. **Instant Autocomplete Search**:
   - Live dropdown popup as you type in the search bar, indexing all 218+ calculators instantly.

5. **Clean & Flexible Routing**:
   - Supports both `.html` and extensionless clean URLs (e.g. `/mortgage-calculator` and `/mortgage-calculator.html`).
   - Built-in zero-dependency Node.js HTTP server.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended; tested with Node.js v24)

### Running the Server

To start the server on port 3000:

```bash
npm start
```
or directly:
```bash
node server.js
```

Then open your browser to:
[http://localhost:3000](http://localhost:3000)

### Custom Port
```bash
PORT=8080 node server.js
```

---

## 📁 Project Structure

```
D:\apps\
├── public\                     # Static website root
│   ├── index.html              # Homepage with embedded Scientific Calculator & Categories
│   ├── sitemap.html            # Complete index of all 218+ calculators
│   ├── about-us.html           # About, Privacy, and Terms
│   ├── financial-calculator.html
│   ├── fitness-and-health-calculator.html
│   ├── math-calculator.html
│   ├── other-calculator.html
│   ├── mortgage-calculator.html
│   ├── loan-calculator.html
│   ├── bmi-calculator.html
│   ├── calorie-calculator.html
│   ├── scientific-calculator.html
│   ├── age-calculator.html
│   ├── percent-calculator.html
│   ├── ... (218+ calculator pages)
│   ├── css\
│   │   ├── style.css
│   │   └── sci.css
│   ├── js\
│   │   ├── common.js           # Search & utilities
│   │   ├── scientific3.js      # Scientific calculator math engine
│   │   ├── calcs-live.js       # Live interactive client-side calculator engine
│   │   ├── conversion.js       # Unit conversion engine
│   │   ├── loannew.js          # Loan amortization generator
│   │   └── calendardateinput.js # Date picker inputs
│   └── img\                    # All local logos, icons, diagrams & illustrations
├── server.js                   # Node.js HTTP server with clean routing & MIME types
├── package.json                # Project manifest and scripts
└── README.md                   # Documentation
```

---

## 🧪 Verification

A comprehensive test suite is included in `verify_clone.py` verifying status codes, MIME headers, file sizes, and URL routing for all core pages and assets.
# Calculator
