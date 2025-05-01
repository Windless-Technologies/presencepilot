## Goals

Ensure dashboard loads quickly and performs well even with large datasets or slow networks.

---

## Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API response time: < 300ms
- Lighthouse score: 90+ across all categories

---

## Techniques

- **Lazy load non-critical components** (charts, analytics)
- **Paginate reviews** (10-20 per page)
- **Compress images** via next/image
- **Minimize JS bundle size** (no large libs unless essential)

---

## API Performance

- Use caching for 3rd-party review fetches (Google/Yelp)
- Avoid N+1 DB queries (batch fetch where needed)
- Use indexes on common search/sort fields (e.g. rating, date)

---

## Frontend Optimization

- TailwindCSS + PurgeCSS for small stylesheets
- Reuse memoized components where list rendering is used
- Use React.lazy for large dashboard modules

---

## Monitoring

- Add Vercel Analytics for front-end perf tracking
- Add API request duration logs per endpoint
