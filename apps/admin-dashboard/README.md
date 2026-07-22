# CampusConnect Admin Dashboard

Dashboard quản trị độc lập của CampusConnect, xây dựng bằng React và Vite.

## Chạy local

Từ repository root:

```powershell
npm run dev:admin
```

Dashboard chạy tại `http://localhost:25443`. Để chạy đồng thời website và
dashboard:

```powershell
npm run dev:web
```

## Quality checks

```powershell
npm run build --workspace=admin-dashboard
npm run lint --workspace=admin-dashboard
```

Quyết định ownership và phạm vi migration được ghi tại
[`docs/ADR-001-CANONICAL-ADMIN.md`](../../docs/ADR-001-CANONICAL-ADMIN.md).
