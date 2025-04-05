# MyAgedCare

MyAgedCare is a Phoenix-based application designed to help users find and manage aged care service providers. Users can search for nearby aged care service providers based on location, get detailed information, and schedule visits.

## Features

- Map-based service provider search
- Distance filtering functionality
- Detailed provider information including service types, facilities, and contact information
- Responsive design that adapts to various device sizes
- User notification system

## Technology Stack

- Elixir/Phoenix Framework
- PostgreSQL Database
- TailwindCSS for styling
- Google Maps API integration
- LiveView for real-time interactions

## Installation and Setup

### Prerequisites

- Elixir (~> 1.14)
- Phoenix (~> 1.7)
- PostgreSQL
- Node.js and npm

### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/xinya0liu/MyAgedCare.git
   cd MyAgedCare
   ```

2. Install dependencies:

   ```bash
   mix deps.get
   cd assets && npm install && cd ..
   ```

3. Configure the database:

   ```bash
   mix ecto.setup
   ```

4. Set up environment variables:
   Create a `.env` file and set necessary environment variables, such as the Google Maps API key:

   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

5. Start the Phoenix server:

   ```bash
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key mix phx.server
   ```

6. Visit [`localhost:4000`](http://localhost:4000) to view the application.

## Contributing

Contributions via issues and pull requests are welcome.

## License

This project is licensed under the MIT License.

## Google Maps API 密钥安全配置

为确保你的 Google Maps API 密钥安全，本应用采用以下安全实践：

### 密钥设置

1. **环境变量配置**：不要在代码中硬编码 API 密钥，而是使用环境变量：

   ```bash
   export GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

2. **API 密钥限制**：在 Google Cloud Console 中设置 API 密钥的限制：

   - 添加 HTTP 引用站点限制 (只允许你的网站域名)
   - 限制 API 调用范围 (只启用必要的 Maps API)
   - 设置配额限制，防止超额使用

3. **签名密钥**（适用于高级用户）：使用客户端密钥对 URL 进行签名：
   ```bash
   export GOOGLE_MAPS_API_SECRET=your_signing_secret
   ```

### 安全措施

本应用中已实现的安全措施：

1. **后端代理**：所有 Google Maps API 请求通过后端代理，API 密钥永不暴露于客户端
2. **引用站点验证**：验证请求来源是否为允许的域名
3. **速率限制**：限制 API 调用频率，防止滥用
4. **URL 签名**：支持对 JavaScript API 请求进行签名验证
5. **请求过滤**：只允许特定类型的 API 请求
6. **错误处理**：生产环境中隐藏敏感错误信息

### 生产环境设置

在生产环境中部署应用时，确保：

1. 更新 `valid_referer?` 函数中的域名列表，使其匹配你的实际生产域名
2. 启用 HTTPS 以确保 API 密钥在传输过程中的安全
3. 定期监控 Google Cloud Console 中的 API 使用情况，检测异常活动
4. 定期轮换 API 密钥，特别是在可能泄露的情况下

通过以上安全措施，你的 Google Maps API 密钥将得到有效保护，不会被滥用或导致意外账单费用。

## Learn more

- Official website: https://www.phoenixframework.org/
- Guides: https://hexdocs.pm/phoenix/overview.html
- Docs: https://hexdocs.pm/phoenix
- Forum: https://elixirforum.com/c/phoenix-forum
- Source: https://github.com/phoenixframework/phoenix
