## Next.js 설명 및 발표를 위한 예시 템플릿

### 회사 발표용 Next.js와 React의 다른점을 기술 및 예시 사이트를 활용하여 보여준다

1. postgreSQL 기반 DB 직접 통신
2. RestAPI를 통한 백엔드를 걸친 비동기 통신
3. 각 경우에 따른 Login 및 Auth 관리를 Next_Auth를 통해 구현

고려사항

1. 글꼴의 최적화와 Next
   https://nextjs.org/learn/dashboard-app/optimizing-fonts-images#why-optimize-fonts
2. 로딩 파일을 통한 비동기의 차이 (스트리밍)
   dashboadr/loading.tsx 및 data.ts의 fetchRevenue 임시 지연
   https://nextjs.org/learn/dashboard-app/streaming
