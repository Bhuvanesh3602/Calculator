/**
 * Long-form guide sections for calculator and hub pages, keyed by page slug.
 * Paragraph strings are trusted HTML (internal links, <strong>, lists).
 * Written for this site; keep each section original and specific.
 */
export interface GuideSection {
  h: string;
  p: string[];
}

export const guides: Record<string, GuideSection[]> = {
  'average-calculator': [
    {
      h: 'Which average should you use?',
      p: [
        'An “average” is any single number that stands in for a whole set, and the right one depends on the shape of your data. Use the <strong>mean</strong> when values are roughly symmetric and there are no extreme outliers, such as the heights of students in a class or daily temperatures across a month.',
        'Use the <strong>median</strong> when data is skewed or has a long tail. House prices, incomes and website response times all have a few very large values that pull the mean upward, so the median describes the typical case far better. Use the <strong>mode</strong> for categories or repeated values, such as the most common shoe size sold or the most frequent answer on a survey.',
        'A quick check: if the mean and median are close, the data is fairly balanced and either works. If they are far apart, report the median and mention the mean, or report both.',
      ],
    },
    {
      h: 'Geometric and harmonic means',
      p: [
        'Two less familiar averages solve problems the ordinary mean gets wrong. The <strong>geometric mean</strong> multiplies the values and takes the nth root, and it is the correct way to average growth rates. An investment that gains 50% one year and loses 50% the next has an arithmetic average return of 0%, yet you end with 75% of your money. The geometric mean, √(1.5 × 0.5) − 1 ≈ −13.4% a year, tells the true story.',
        'The <strong>harmonic mean</strong> divides the count by the sum of reciprocals, and it is the right average for rates over a fixed amount, such as speeds over the same distance. Drive 60 mph to a town and 40 mph back and your average speed is not 50 mph but 2 ÷ (1/60 + 1/40) = <strong>48 mph</strong>, because you spend longer at the slower speed.',
      ],
    },
    {
      h: 'Trimmed means and handling outliers',
      p: [
        'A trimmed mean drops a fixed share of the highest and lowest values before averaging. Many judged sports discard the top and bottom scores for exactly this reason: one unusually generous or harsh judge cannot swing the result. A 10% trimmed mean of 20 values removes the two highest and two lowest, then averages the remaining 16.',
        'Before you remove an outlier, ask whether it is an error or a real observation. A typo such as 1,000 instead of 100 should be corrected. A genuine extreme value, such as one very large sale, belongs in the data, and the honest approach is to report the median alongside the mean rather than delete it.',
      ],
    },
    {
      h: 'Averages you meet every day',
      p: [
        'A course grade is a <a href="/grade-calculator/">weighted average</a>, where a final exam may count four times as much as a quiz. A grade point average is another weighted mean, with credit hours as the weights; see the <a href="/gpa-calculator/">GPA calculator</a>. Stock charts and health dashboards use moving averages, such as a 7-day average of new cases, which smooth out daily noise by averaging only the most recent window of values.',
        'Averages also hide spread. Two classes can both average 75% while one has every student between 70 and 80 and the other ranges from 40 to 100. Pair the average with the <a href="/standard-deviation-calculator/">standard deviation</a> or range to see how consistent the values really are.',
      ],
    },
  ],

  'bmi-calculator': [
    {
      h: 'Where BMI came from',
      p: [
        'The formula behind BMI was described in the 1830s by the Belgian mathematician Adolphe Quetelet, who was studying the “average man” and noticed that adult weight tends to scale with the square of height. For more than a century it was known simply as the Quetelet index.',
        'In 1972 the physiologist Ancel Keys compared several weight-for-height measures and found Quetelet’s worked best as a simple population marker of body fat, and he gave it the name <strong>body mass index</strong>. It was designed to compare groups of people, not to diagnose one person, and that origin explains both its usefulness and its limits.',
      ],
    },
    {
      h: 'BMI Prime and the “new BMI”',
      p: [
        '<strong>BMI Prime</strong> divides your BMI by 25, the upper limit of the healthy range. A result of 1.00 sits exactly at that limit, 0.90 is 10% below it and 1.20 is 20% above it. It turns the number into a simple percentage that is easy to track over time.',
        'Because people do not scale up evenly in every direction, the Oxford mathematician Nick Trefethen proposed an alternative in 2013: <strong>1.3 × weight (kg) ÷ height (m)<sup>2.5</sup></strong>. For a person of average height it gives almost the same number as standard BMI, but it reads slightly lower for tall people and slightly higher for short people, who the classic formula tends to over- and under-rate. It is not used clinically, but it shows why a single cut-off can misjudge people at the extremes of height.',
      ],
    },
    {
      h: 'Waist-to-height ratio: a simple companion check',
      p: [
        'Fat stored around the abdomen carries more health risk than fat stored elsewhere, and BMI cannot see where weight sits. The waist-to-height ratio adds that information with nothing more than a tape measure. Divide your waist (measured midway between the bottom rib and the top of the hip bone) by your height, in the same units.',
        'UK NICE guidance, updated in 2022, advises keeping your waist to less than half your height. A ratio of <strong>0.4 to 0.49</strong> is considered healthy, <strong>0.5 to 0.59</strong> signals increased risk and <strong>0.6 or more</strong> signals high risk. For a 5′6″ (66-inch) adult, that means keeping the waist under 33 inches.',
      ],
    },
    {
      h: 'What to do with your result',
      p: [
        'Treat BMI as a starting point for a conversation, not a verdict. If your BMI is outside the healthy range, look at the trend over months rather than a single reading, and consider waist size, blood pressure, blood sugar and activity level together. Athletes with a lot of muscle often score “overweight” while being very lean, and older adults can have a normal BMI with low muscle mass.',
        'If you want to change your weight, an energy target is more actionable than a BMI target. The <a href="/calorie-calculator/">calorie calculator</a> estimates daily needs, and the <a href="/ideal-weight-calculator/">ideal weight calculator</a> compares several published formulas for your height.',
      ],
    },
  ],

  'factoring-calculator': [
    {
      h: 'A checklist for factoring any polynomial',
      p: [
        'Most factoring mistakes come from trying techniques in the wrong order. Work through this list every time:',
        '<ol><li><strong>Take out the greatest common factor.</strong> 6x² + 9x becomes 3x(2x + 3). Skipping this step makes every later step harder.</li><li><strong>Count the terms.</strong> Two terms suggest a difference of squares or a sum or difference of cubes. Three terms suggest a trinomial or a perfect square. Four terms suggest factoring by grouping.</li><li><strong>Factor the pieces you found.</strong> A factor such as x² − 9 can often be factored again.</li><li><strong>Check by multiplying back.</strong> Expanding your answer should return the original expression exactly.</li></ol>',
      ],
    },
    {
      h: 'The AC method, step by step',
      p: [
        'When a trinomial ax² + bx + c has a leading coefficient other than 1, the AC method avoids guesswork. Take <strong>2x² + 7x + 3</strong>. Multiply a × c = 2 × 3 = 6, then find two numbers that multiply to 6 and add to b = 7: they are 1 and 6.',
        'Split the middle term with those numbers: 2x² + x + 6x + 3. Group in pairs and factor each pair: x(2x + 1) + 3(2x + 1). The shared bracket comes out, leaving <strong>(2x + 1)(x + 3)</strong>. Multiply back to confirm: 2x² + 6x + x + 3 = 2x² + 7x + 3.',
      ],
    },
    {
      h: 'Patterns worth memorizing',
      p: [
        'A few special products appear constantly, and recognizing them saves time:',
        '<ul><li>Difference of squares: a² − b² = (a − b)(a + b), so 4x² − 25 = (2x − 5)(2x + 5).</li><li>Perfect square trinomials: a² ± 2ab + b² = (a ± b)², so x² + 10x + 25 = (x + 5)².</li><li>Sum and difference of cubes: a³ ± b³ = (a ± b)(a² ∓ ab + b²), so x³ − 8 = (x − 2)(x² + 2x + 4).</li><li>Grouping: x³ + 3x² + 2x + 6 = x²(x + 3) + 2(x + 3) = (x² + 2)(x + 3).</li></ul>',
        'A sum of squares such as x² + 9 does not factor over the real numbers, a common trap on tests.',
      ],
    },
    {
      h: 'Knowing in advance whether a quadratic factors',
      p: [
        'For a quadratic with integer coefficients, compute the discriminant b² − 4ac before you start searching. If it is a <strong>perfect square</strong> (0, 1, 4, 9, 16, 25 …), the quadratic factors neatly over the integers. For 2x² + 7x + 3 it is 49 − 24 = 25, a perfect square, which is why the AC method worked. If the discriminant is positive but not a perfect square, the roots are irrational and you will need the quadratic formula. If it is negative, there are no real roots.',
        'Factoring matters because of the zero-product property: once (2x + 1)(x + 3) = 0, either 2x + 1 = 0 or x + 3 = 0, so x = −½ or x = −3. The same idea simplifies rational expressions and finds where a graph crosses the x-axis; try plotting one in the <a href="/graphing-calculator/">graphing calculator</a>.',
      ],
    },
  ],

  'gcf-calculator': [
    {
      h: 'Three ways to find the GCF, compared',
      p: [
        '<strong>Listing factors</strong> works for small numbers: the factors of 18 are 1, 2, 3, 6, 9 and 18, the factors of 24 are 1, 2, 3, 4, 6, 8, 12 and 24, and the largest one in both lists is 6. It becomes slow quickly once numbers pass 100.',
        '<strong>Prime factorization</strong> breaks each number into primes and multiplies the primes they share at their lowest powers. It also gives you the LCM almost for free, using the highest powers instead. Its weakness is that factoring large numbers is hard.',
        'The <strong>Euclidean algorithm</strong> repeatedly replaces the larger number with the remainder of dividing it by the smaller, and it never needs to factor anything. It is extremely fast: Lamé’s theorem (1844) shows the number of division steps is never more than five times the number of digits in the smaller number. That is why computers use it, and why this calculator shows it.',
      ],
    },
    {
      h: 'Real problems the GCF solves',
      p: [
        'Any time you need to split things into the <strong>largest equal groups with nothing left over</strong>, you are finding a GCF. A teacher with 40 boys and 32 girls who wants identical mixed teams can make GCF(40, 32) = 8 teams, each with 5 boys and 4 girls.',
        'Cutting materials works the same way. An 18-inch by 24-inch board cut into the largest possible equal squares gives squares of GCF(18, 24) = 6 inches, and 3 × 4 = 12 pieces. The same reasoning reduces a <a href="/ratio-calculator/">ratio</a> such as 18:24 to 3:4, and simplifies a <a href="/fraction-calculator/">fraction</a> such as 18/24 to 3/4.',
      ],
    },
    {
      h: 'The GCF of algebraic terms',
      p: [
        'The idea extends to variables, which is the first step in factoring expressions. Find the GCF of the coefficients, then take each shared variable at its lowest power. For <strong>12x³y</strong> and <strong>18x²y²</strong>, the coefficient GCF is 6, x appears at least squared and y at least once, so the GCF is <strong>6x²y</strong>.',
        'Pulling it out gives 12x³y + 18x²y² = 6x²y(2x + 3y). The <a href="/factoring-calculator/">factoring calculator</a> does this automatically before it tries any other technique.',
      ],
    },
  ],

  'grade-calculator': [
    {
      h: 'Turning your syllabus into a grade sheet',
      p: [
        'Your syllabus is the key to an accurate grade. Look for the grading breakdown, which usually lists categories and their weights, such as homework 20%, quizzes 15%, midterm 25% and final exam 40%. Enter each category with its weight, then the average score you have in that category so far.',
        'Check two details that change the math. First, whether the course uses <strong>weighted categories</strong> or <strong>total points</strong>. In a points system, a 200-point exam simply counts twice as much as a 100-point one, and your grade is points earned divided by points possible. Second, whether any scores are dropped. If the lowest of four quizzes (70, 85, 90, 95) is dropped, your quiz average rises from 85 to 90.',
      ],
    },
    {
      h: 'Common grading scales',
      p: [
        'Most US schools use the 10-point scale: <strong>A 90–100, B 80–89, C 70–79, D 60–69 and F below 60</strong>. Many add plus and minus grades, typically with 7 and above in a band earning a plus and below 3 earning a minus, so 87 is a B+ and 82 is a B−. Some colleges and private schools use a stricter scale where an A starts at 93 or 94.',
        'On a 4.0 scale, plus and minus grades are usually worth A 4.0, A− 3.7, B+ 3.3, B 3.0, B− 2.7, and so on down by thirds. Your instructor’s syllabus always overrides any general scale, so confirm the cut-offs before planning around them. To see how course grades feed into your overall average, use the <a href="/gpa-calculator/">GPA calculator</a>.',
      ],
    },
    {
      h: 'Working out the best grade you can still reach',
      p: [
        'Midway through a term it helps to know your ceiling. Multiply your current average by the share of the course already graded, then add the remaining weight as if you score 100% on everything left. With an 82% average across 60% of the course and a final worth 40%, the best possible result is 0.6 × 82 + 40 = <strong>89.2%</strong>, just short of an A on the standard scale.',
        'Run the same calculation with realistic scores rather than perfect ones to set a target, or use the <a href="/final-grade-calculator/">final grade calculator</a> to find the exact score you need on the exam. If the target is out of reach, ask your instructor early about extra credit or dropped scores rather than after the final.',
      ],
    },
  ],

  'integral-calculator': [
    {
      h: 'Which integration technique to try first',
      p: [
        'Integration is pattern recognition. Try these in order:',
        '<ol><li><strong>Basic rules.</strong> Power rule, ∫xⁿ dx = xⁿ⁺¹/(n + 1) + C, plus the standard results for eˣ, sin x, cos x and 1/x.</li><li><strong>u-substitution.</strong> Look for a function and its derivative together. In ∫2x cos(x²) dx, let u = x², so du = 2x dx and the answer is sin(x²) + C.</li><li><strong>Integration by parts.</strong> For a product such as x·eˣ, use ∫u dv = uv − ∫v du. With u = x and dv = eˣ dx, ∫x eˣ dx = (x − 1)eˣ + C. The LIATE order (logarithms, inverse trig, algebraic, trig, exponential) helps you pick u.</li><li><strong>Partial fractions</strong> for rational functions, and <strong>trigonometric substitution</strong> for expressions such as √(a² − x²).</li></ol>',
      ],
    },
    {
      h: 'What definite integrals are used for',
      p: [
        '<strong>Area between curves:</strong> integrate the top function minus the bottom one between their crossing points. <strong>Average value:</strong> the average of f on [a, b] is (1/(b − a))∫f(x) dx, so the average of x² on [0, 3] is (1/3) × 9 = 3. <strong>Volume:</strong> rotating y = √x from 0 to 4 around the x-axis gives π∫x dx = 8π cubic units by the disk method.',
        'In physics, integrating velocity gives distance travelled and integrating force over distance gives work. In statistics, the area under a probability density curve between two points is the probability of landing in that interval, which is why the normal distribution’s integral matters so much even though it has no simple antiderivative.',
      ],
    },
    {
      h: 'Common mistakes to avoid',
      p: [
        '<strong>Forgetting + C</strong> on an indefinite integral loses marks on almost every test. <strong>Not changing the limits</strong> after a substitution is another classic: if u = x² and x runs from 0 to 2, then u runs from 0 to 4.',
        'Remember that a definite integral gives <strong>signed</strong> area. ∫₀^{2π} sin x dx = 0 because the area above the axis cancels the area below it. If you want the total area, split the interval where the function changes sign: the total area here is 4.',
        '<strong>Improper integrals</strong> run to infinity or across a vertical asymptote, and they may or may not converge. ∫₁^∞ 1/x² dx = 1, a finite area under an infinitely long curve, while ∫₁^∞ 1/x dx grows without limit.',
      ],
    },
  ],

  'interest-rate-calculator': [
    {
      h: 'Nominal, periodic and effective rates',
      p: [
        'A loan rate is usually quoted as a <strong>nominal annual rate</strong>, but interest is charged per period. A 12% nominal rate compounded monthly is 1% a month, and because each month’s interest earns interest, the <strong>effective annual rate</strong> is 1.01¹² − 1 = 12.68%.',
        'This is why a credit card at 24% APR costs more than 24% a year if you carry a balance, and why savings accounts advertise APY, which already includes compounding. When comparing offers, convert everything to the same basis first.',
      ],
    },
    {
      h: 'What a few points cost on a real loan',
      p: [
        'Rate differences look small on paper and large in your budget. On a <strong>$25,000 loan over 60 months</strong>:',
        '<ul><li>At 6%, the payment is $483.32 and total interest is about <strong>$3,999</strong>.</li><li>At 8%, the payment is $506.91 and total interest is about <strong>$5,415</strong>.</li><li>At 10%, the payment is $531.18 and total interest is about <strong>$6,871</strong>.</li></ul>',
        'Going from 6% to 10% adds under $48 a month but nearly $2,900 over the loan. That is exactly the trade-off a “low monthly payment” pitch hides, and why it pays to solve for the rate from the payment you are quoted. See the full schedule in the <a href="/loan-calculator/">loan calculator</a>.',
      ],
    },
    {
      h: 'What determines the rate you are offered',
      p: [
        'Lenders start from a benchmark, such as the prime rate for many credit cards and lines of credit, or Treasury yields for mortgages, and add a margin for risk. Your <strong>credit score</strong> has the largest effect on that margin. <strong>Loan term</strong> matters too: longer loans usually carry higher rates. A larger <strong>down payment</strong> lowers the lender’s risk, and secured loans, such as auto loans, are cheaper than unsecured personal loans.',
        'Getting quotes from two or three lenders within a short window lets you compare without much effect on your credit score, since credit scoring models generally treat multiple inquiries for the same type of loan as a single shopping event.',
      ],
    },
    {
      h: 'Quick mental tools',
      p: [
        'The <strong>Rule of 72</strong> estimates doubling time: divide 72 by the annual rate. At 6%, money doubles in about 12 years; at 9%, in about 8. It works for debt too, which shows how quickly unpaid high-rate balances grow.',
        'The <strong>real interest rate</strong> adjusts for inflation: (1 + nominal) ÷ (1 + inflation) − 1. A 5% savings rate with 3% inflation grows your purchasing power by only about 1.94% a year. The <a href="/inflation-calculator/">inflation calculator</a> and <a href="/compound-interest-calculator/">compound interest calculator</a> show both effects over time.',
      ],
    },
  ],

  'protein-calculator': [
    {
      h: 'Protein quality: not all grams are equal',
      p: [
        'Protein is built from 20 amino acids, nine of which your body cannot make. Foods that supply all nine in useful amounts are called <strong>complete proteins</strong>: meat, fish, eggs, dairy, soy and quinoa. Most other plant foods are low in one or two, but pairing them across the day, such as rice with beans or hummus with whole-wheat pita, fills the gaps.',
        'Nutrition scientists score protein quality with PDCAAS and the newer DIAAS method, recommended by the FAO in 2013, which measures how much of each essential amino acid is actually absorbed. Animal proteins and soy score highest. If most of your protein comes from plants, aiming roughly 10% above your target is a practical way to make up for lower digestibility.',
      ],
    },
    {
      h: 'Protein needs in different life stages',
      p: [
        '<strong>Older adults</strong> lose muscle more easily and respond less to each meal of protein. An international expert group (PROT-AGE, 2013) recommended 1.0 to 1.2 g per kg of body weight for healthy people over 65, above the standard 0.8 g/kg RDA. <strong>During pregnancy</strong> the RDA rises to about 1.1 g/kg, or around 71 g a day for most women.',
        '<strong>During weight loss</strong>, higher protein helps protect muscle and keeps you fuller, and many studies use 1.6 g/kg or more while eating in a calorie deficit. People with chronic kidney disease are often advised to limit protein, so anyone with a kidney condition should follow their doctor’s target instead of a general calculator.',
      ],
    },
    {
      h: 'A sample high-protein day',
      p: [
        'A moderately active 150 lb (68 kg) adult aiming for 1.6 g/kg needs about 109 g a day. Spreading it over four eating occasions keeps each meal near the 0.4 g/kg that research suggests is useful for muscle building:',
        '<ul><li><strong>Breakfast:</strong> 3 large eggs and a glass of milk, about 27 g.</li><li><strong>Lunch:</strong> 100 g of cooked chicken breast in a salad or wrap, about 31 g.</li><li><strong>Snack:</strong> a 170 g pot of plain Greek yogurt, about 17 g.</li><li><strong>Dinner:</strong> a cup of cooked lentils with 100 g of firm tofu, about 35 g.</li></ul>',
        'That adds up to roughly 110 g. Values are approximate and vary by brand and preparation. To fit protein into a full calorie plan, use the <a href="/macro-calculator/">macro calculator</a>.',
      ],
    },
  ],

  'sales-tax-calculator': [
    {
      h: 'How US sales tax differs from VAT',
      p: [
        'In most of the world, a <strong>value-added tax</strong> (VAT) is collected at every stage of production and already included in the shelf price. US <strong>sales tax</strong> is charged only once, on the final retail sale, and is usually added at the register, which is why the price on the tag is rarely what you pay.',
        'There is no federal sales tax in the US. Each state sets its own base rate, and counties, cities and special districts can add their own, so two stores a few miles apart can charge different totals for the same item. Alaska, Delaware, Montana, New Hampshire and Oregon have no statewide sales tax, though some Alaskan towns charge a local one.',
      ],
    },
    {
      h: 'What is usually taxed and what is not',
      p: [
        'Rules vary by state, but some patterns hold. <strong>Prescription drugs</strong> are exempt almost everywhere. <strong>Groceries</strong> are exempt or taxed at a reduced rate in most states, while prepared food, candy and soft drinks are often taxed at the full rate. <strong>Clothing</strong> is exempt in a few states, sometimes only below a price limit. <strong>Services</strong>, such as haircuts or repairs, are taxed in some states and not in others.',
        'If you buy something online or out of state and the seller does not collect tax, many states expect you to pay <strong>use tax</strong> at the same rate, often reported on your state income tax return.',
      ],
    },
    {
      h: 'Notes for small businesses and online sellers',
      p: [
        'You generally need to collect a state’s sales tax when you have <strong>nexus</strong> there. A physical presence creates nexus, and since the 2018 Supreme Court decision in South Dakota v. Wayfair, so can sales volume alone. Many states set this economic nexus threshold at $100,000 in annual sales into the state. Most states charge the buyer’s local (destination) rate, while a few, such as Texas and Ohio, use the seller’s location for in-state sales.',
        'Items you buy to resell are usually exempt when you give the supplier a <strong>resale certificate</strong>. When you calculate tax on an invoice, apply the rate to the taxable subtotal and round to the nearest cent: $19.99 at 7.25% is $1.449, which rounds to <strong>$1.45</strong>. Always confirm current rates with your state revenue department, as they change several times a year.',
      ],
    },
  ],

  'triangle-calculator': [
    {
      h: 'Classifying a triangle from its sides',
      p: [
        'By sides, a triangle is <strong>equilateral</strong> (all three equal), <strong>isosceles</strong> (two equal) or <strong>scalene</strong> (none equal). By angles, it is <strong>acute</strong> (all under 90°), <strong>right</strong> (one exactly 90°) or <strong>obtuse</strong> (one over 90°).',
        'You can tell which angle type you have without measuring any angle. Let c be the longest side and compare c² with a² + b². If c² is smaller, the triangle is acute; if they are equal, it is a right triangle; if c² is larger, it is obtuse. For sides 6, 7 and 10, 10² = 100 is greater than 6² + 7² = 85, so the triangle is obtuse.',
      ],
    },
    {
      h: 'Special right triangles',
      p: [
        'Two right triangles have side ratios worth memorizing because they come up in geometry, trigonometry and construction:',
        '<ul><li><strong>45-45-90:</strong> sides in the ratio 1 : 1 : √2. Cutting a square along its diagonal makes two of them, so a square of side 5 has a diagonal of 5√2 ≈ 7.07.</li><li><strong>30-60-90:</strong> sides in the ratio 1 : √3 : 2. Half of an equilateral triangle is one of these, so an equilateral triangle of side 10 has a height of 5√3 ≈ 8.66.</li></ul>',
        'Integer right triangles such as 3-4-5, 5-12-13 and 8-15-17 are called Pythagorean triples. Builders use 3-4-5 to check that a corner is square: measure 3 ft along one wall and 4 ft along the other, and the diagonal between those points should be exactly 5 ft.',
      ],
    },
    {
      h: 'Triangle centers',
      p: [
        'A triangle has several centers, each built a different way. The <strong>centroid</strong> is where the three medians meet; it is the balance point and divides each median in a 2:1 ratio. The <strong>incenter</strong>, where the angle bisectors meet, is the center of the largest circle that fits inside. The <strong>circumcenter</strong>, where the perpendicular bisectors of the sides meet, is the center of the circle through all three corners. The <strong>orthocenter</strong> is where the three altitudes meet.',
        'In every triangle that is not equilateral, the centroid, circumcenter and orthocenter lie on one straight line, the Euler line. In an equilateral triangle, all four centers are the same point.',
      ],
    },
    {
      h: 'Triangles in real projects',
      p: [
        'Roof pitch is a right-triangle problem. A 6/12 pitch rises 6 inches for every 12 inches of horizontal run, an angle of about 26.6°. For a 12 ft run, the rise is 6 ft and the rafter length is √(12² + 6²) ≈ 13.42 ft before any overhang.',
        'Ladder safety uses the same geometry. The common 4-to-1 rule, one foot out from the wall for every four feet of height, sets the ladder at about 75°. Surveyors use triangulation, measuring one baseline and two angles and then applying the law of sines, to find distances they cannot measure directly. For slopes and gradients, the <a href="/slope-calculator/">slope calculator</a> handles rise over run.',
      ],
    },
  ],

  'construction-calculators': [
    {
      h: 'How to plan a project with these calculators',
      p: [
        'Most building and DIY jobs follow the same four steps. <strong>Measure</strong> every dimension you need, in one unit, and sketch the space. <strong>Find the size</strong>: area for flooring, paint, tile and turf; volume for concrete, soil, mulch and gravel. <strong>Convert to material units</strong>, such as boxes, bags, gallons or cubic yards. Then <strong>add a waste allowance</strong> for cuts, breakage and mistakes.',
        'For flooring or tiling, start with the <a href="/square-footage-calculator/">square footage calculator</a>. For irregular shapes such as triangles, circles and trapezoids, use the <a href="/area-calculator/">area calculator</a>. For slabs, footings and post holes, the <a href="/concrete-calculator/">concrete calculator</a> converts straight to bags or cubic yards. For tanks, planters and fill, use the <a href="/volume-calculator/">volume calculator</a>.',
      ],
    },
    {
      h: 'Measuring irregular rooms',
      p: [
        'Very few rooms are perfect rectangles. Split an L-shaped or angled room into simple rectangles and triangles, calculate each one separately and add them together. Subtract fixed areas you will not cover, such as a kitchen island, but do not subtract closets you intend to floor.',
        'Measure each wall at two points. Older walls are often out of square, and using the larger measurement prevents coming up short. Round up to the nearest inch, or the nearest centimeter, rather than down.',
      ],
    },
    {
      h: 'Typical waste allowances',
      p: [
        'Order more than the exact area or volume. These allowances are common starting points; the manufacturer’s guidance for your product should come first.',
        '<ul><li><strong>Tile, straight layout:</strong> about 10%. <strong>Diagonal or herringbone:</strong> 15% to 20%.</li><li><strong>Hardwood, laminate and vinyl plank:</strong> 5% to 10%.</li><li><strong>Concrete:</strong> 5% to 10% for uneven ground, spillage and form flex.</li><li><strong>Drywall:</strong> about 10%.</li><li><strong>Paint:</strong> one gallon covers roughly 350 to 400 sq ft per coat on smooth walls, and most jobs need two coats.</li></ul>',
        'Keep one spare box of tile or flooring from the same batch. Colors vary between production runs, and an exact match can be impossible to find later.',
      ],
    },
    {
      h: 'Unit conversions builders use most',
      p: [
        '<ul><li>1 cubic yard = 27 cubic feet. A 10 ft × 10 ft slab 4 inches thick needs 33.3 cubic feet, about 1.23 cubic yards.</li><li>An 80 lb bag of premixed concrete yields about 0.60 cubic feet, and a 60 lb bag about 0.45 cubic feet.</li><li>1 square meter = 10.764 square feet, and 1 square foot = 0.0929 square meters.</li><li>1 acre = 43,560 square feet.</li><li>1 inch = 2.54 centimeters exactly.</li></ul>',
        'For longer measurements, such as fence lines and property boundaries, the <a href="/distance-calculator/">distance calculator</a> converts between feet, meters, yards and miles.',
      ],
    },
  ],
};
