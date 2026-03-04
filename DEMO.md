# ESG Compliance Platform -- Hackathon Demo Guide

> **一句话介绍**：面向全球供应链的 B2B ESG 合规自动化审计 SaaS 平台，用 AI 重新定义供应链透明度。

---

## 我们要解决什么问题？

全球供应链中的 ESG 合规审计面临三大痛点：

| 痛点 | 现状 | 我们的方案 |
|------|------|-----------|
| 审计成本高 | 单次人工审计耗费数万美元、数周时间 | 规则引擎自动化检查，秒级出结果 |
| 供应链不透明 | 只能看到一级供应商，下游完全黑箱 | 多级穿透可视化，直达原材料产地 |
| 标准复杂 | CSRD、CBAM 等法规专业门槛极高 | 内置国际标准模板，一键生成合规报告 |

---

## 核心功能演示

### 1. Dashboard -- 全局合规态势感知

**路径**：`http://localhost:3000/dashboard`

一屏展示所有关键 ESG 指标：
- 供应商总数、活跃审计数、关键预警数、平均合规评分
- 风险分布可视化（Low / Medium / High / Critical）
- 最新合规预警实时推送

### 2. Supplier Management -- 供应商全生命周期管理

**路径**：`http://localhost:3000/suppliers`

- 多维度筛选：按供应链层级（Tier 1/2/3）、风险等级、国家
- 每个供应商展示：认证状态（GOTS / OEKO-TEX / Bluesign 绿色标签）、ESG 数据
- 支持 CSV 批量导入供应商数据
- **演示操作**：切换 Tier 和 Risk 筛选器，观察表格动态过滤

### 3. Audit Engine -- 自动化合规审计

**路径**：`http://localhost:3000/audits`

- 选择供应商 + 选择标准（CSRD / CBAM）→ 一键创建审计任务
- 规则引擎自动评估每个供应商的 ESG 数据，产出：
  - 合规评分（0-100%）
  - 逐项检查结果（通过 / 不通过 / 数据缺失）
  - 针对性改进建议
- **演示操作**：查看已完成的审计任务，注意评分颜色编码（绿 >=80% / 黄 >=50% / 红 <50%）

### 4. Report Generation -- 一键导出审计报告

**路径**：`http://localhost:3000/reports`

- 基于审计结果自动生成专业 PDF 报告
- 报告内容：总览评分、逐供应商合规详情、违规项与建议
- 符合 CSRD 格式要求，可直接用于监管提交
- **演示操作**：点击 "Download PDF" 下载报告

### 5. Supply Chain Transparency -- 深度供应链穿透

**路径**：`http://localhost:3000/supply-chain`

**这是我们的核心差异化功能：**

- 交互式树状图展示多级供应链关系：
  - Tier 1 成衣厂 → Tier 2 染色厂 → Tier 3 原材料商
- 每个节点标注：
  - 工厂名称 + 地理位置（城市、国家）
  - 风险等级（边框颜色编码）
  - 持有的国际认证
- 无认证的供应商醒目标记 "No Cert" 红色警告
- **演示操作**：点击节点展开/折叠子供应链，观察风险如何从上游传导到下游

### 6. Compliance Alerts -- 合规预警系统

**路径**：`http://localhost:3000/alerts`

为初学者自动标记合规风险，无需专业知识即可识别问题：
- **Critical**：认证过期（如 GOTS 证书到期）、碳排放超标
- **Warning**：缺乏绿色认证、ESG 数据未提交、安全事故偏多
- 每条预警包含：受影响供应商、具体原因、严重程度
- 一键 "Resolve" 标记已处理
- **演示操作**：按 Severity 筛选，点击 Resolve 处理预警

### 7. AI Supplier Matching -- LLM 智能供应商匹配

**路径**：`http://localhost:3000/match`

- 用自然语言描述采购需求，例如：

  > "I need a GOTS-certified organic cotton fabric supplier in Asia with low carbon emissions"

- AI 自动解析出结构化标签：材料、认证要求、地区、可持续性优先级
- 基于标签 + ESG 表现 + 认证匹配度进行多维评分
- 返回按匹配度排名的供应商推荐列表
- **演示操作**：在输入框输入需求描述，点击 "Find Suppliers" 查看匹配结果

---

## 后端 API 文档

**路径**：`http://localhost:8000/docs`

FastAPI 自动生成的 Swagger UI 交互式文档，可直接在线测试所有 API。

**演示账号**：
- Email: `demo@esgplatform.com`
- Password: `demo123456`

---

## 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                 │
│  React 19 + TypeScript + Tailwind CSS + React Flow      │
│  App Router | SSR | Recharts                            │
├─────────────────────────────────────────────────────────┤
│                      API Gateway                        │
│               FastAPI + JWT Authentication               │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  Audit   │ Report   │ Supply   │Compliance│    LLM      │
│  Engine  │Generator │  Chain   │  Alert   │  Matcher    │
│          │          │ Service  │ Scanner  │             │
│ CSRD/CBAM│Jinja2+PDF│ Graph    │ Auto-    │ GPT-4 +     │
│ Rules    │Templates │ Traversal│ Flagging │ LangChain   │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│               Data Layer (SQLAlchemy 2.0)               │
│         PostgreSQL / SQLite  |  Redis Cache             │
└─────────────────────────────────────────────────────────┘
```

### 技术选型理由

| 层级 | 技术 | 为什么选它 |
|------|------|-----------|
| **后端框架** | FastAPI | 异步高性能，自动生成 OpenAPI 文档，Python 生态丰富 |
| **ORM** | SQLAlchemy 2.0 | 支持复杂关系查询（多级供应链自引用），类型安全 |
| **前端框架** | Next.js 15 + React 19 | App Router + SSR，首屏加载快，SEO 友好 |
| **样式方案** | Tailwind CSS | 原子化 CSS，开发效率极高，设计一致性好 |
| **LLM 集成** | OpenAI GPT-4 + LangChain | 需求解析准确率高，LangChain 提供标准化封装 |
| **报告生成** | Jinja2 + WeasyPrint | HTML 模板灵活，PDF 渲染质量专业级 |
| **容器化** | Docker Compose | 一键启动全栈，开发环境一致性 |

### 数据模型核心设计

```
Organization ──1:N── User
     │
     └──1:N── Supplier ──self-ref── Supplier (多级供应链)
                 │
                 ├──1:N── ESGRecord (E/S/G 三维量化数据)
                 ├──1:N── Certification (GOTS/OEKO-TEX/...)
                 └──N:M── AuditItem ──N:1── ComplianceStandard
                              │
                              └──N:1── AuditTask ──1:N── AuditReport
```

**关键设计**：`Supplier` 通过 `parent_supplier_id` 自引用实现任意深度的供应链穿透，无需图数据库即可完成多级关系查询。

---

## 快速启动（一分钟跑起来）

```bash
# 1. 克隆项目
git clone https://github.com/Yangbadger222/ESG.git
cd ESG

# 2. 启动后端
cd backend
pip install -r requirements.txt
python -m app.seed              # 初始化演示数据
uvicorn app.main:app --reload   # 启动 API (localhost:8000)

# 3. 启动前端（新终端）
cd frontend
npm install
npm run dev                     # 启动 UI (localhost:3000)
```

---

## 项目结构速览

```
ESG/
├── backend/                     # Python FastAPI 后端
│   ├── app/
│   │   ├── api/v1/              # 5 组 RESTful API
│   │   │   ├── auth.py          # 注册 / 登录 / JWT
│   │   │   ├── suppliers.py     # 供应商 CRUD + CSV 导入 + 供应链图
│   │   │   ├── audits.py        # 审计任务创建与执行
│   │   │   ├── reports.py       # PDF 报告生成与下载
│   │   │   └── alerts.py        # 合规预警查询与扫描
│   │   ├── models/              # 10 个数据模型
│   │   ├── services/            # 5 个核心业务引擎
│   │   │   ├── audit_engine.py  # CSRD/CBAM 规则引擎
│   │   │   ├── report_generator.py
│   │   │   ├── compliance_alert.py
│   │   │   ├── llm_matcher.py   # GPT-4 需求解析 + 匹配
│   │   │   └── supply_chain.py  # 多级穿透分析
│   │   └── seed.py              # 演示数据生成
│   └── requirements.txt
├── frontend/                    # Next.js 前端
│   └── src/app/
│       ├── dashboard/           # 总览仪表盘
│       ├── suppliers/           # 供应商管理
│       ├── audits/              # 审计任务
│       ├── reports/             # 报告中心
│       ├── supply-chain/        # 供应链可视化
│       ├── alerts/              # 合规预警
│       └── match/               # AI 匹配
├── docker-compose.yml
└── DEMO.md                      # 本文件
```

---

## 未来路线图

- **Phase 2**：接入真实 ESG 数据源 API（CDP、Bloomberg ESG）
- **Phase 2**：React Flow 交互式拓扑图 + 地图视图（Mapbox）
- **Phase 3**：多语言国际化（EN / ZH / DE / FR）
- **Phase 3**：Webhook 通知 + Slack/Teams 集成
- **Phase 4**：AI 生成审计报告摘要与改进建议
- **Phase 4**：支持更多标准（GRI、SASB、TCFD）

---

**Built with FastAPI + Next.js + GPT-4 | Hackathon 2026**
