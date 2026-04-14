import { test, expect, type Page } from '@playwright/test'

// --- Mock API data ---
const MOCK_SUMMARY = {
  summary: { INFO: 12847, WARNING: 3421, ERROR: 892, CRITICAL: 156 },
  histogram: [
    { source: 'api-server', INFO: 8000, WARNING: 2000, ERROR: 500, CRITICAL: 100 },
    { source: 'worker', INFO: 4847, WARNING: 1421, ERROR: 392, CRITICAL: 56 },
  ],
}

const MOCK_TIMESERIES = {
  interval: 'day',
  data: [
    { timestamp: '2026-04-01T00:00:00Z', INFO: 500, WARNING: 100, ERROR: 50, CRITICAL: 10 },
    { timestamp: '2026-04-02T00:00:00Z', INFO: 600, WARNING: 150, ERROR: 80, CRITICAL: 0 },
  ],
}

// ERROR only filtered summary (E-08 用)
const MOCK_SUMMARY_ERROR_ONLY = {
  summary: { INFO: 0, WARNING: 0, ERROR: 892, CRITICAL: 0 },
  histogram: [
    { source: 'api-server', INFO: 0, WARNING: 0, ERROR: 500, CRITICAL: 0 },
  ],
}

const MOCK_TIMESERIES_AFTER_FILTER = {
  interval: 'day',
  data: [
    { timestamp: '2026-04-01T00:00:00Z', INFO: 100, WARNING: 20, ERROR: 10, CRITICAL: 0 },
  ],
}

/** バックエンドを起動せず API をモックするセットアップ */
async function setupApiMocks(
  page: Page,
  summaryData = MOCK_SUMMARY
) {
  await page.route('**/api/v1/logs/analytics/summary**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryData),
    })
  })
  await page.route('**/api/v1/logs/analytics/timeseries**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TIMESERIES),
    })
  })
}

// E-01: ダッシュボードにアクセスしたとき 4つのサマリーカードが表示される
test('E-01: shows_four_summary_cards_on_dashboard', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  await expect(page.getByTestId('summary-card-info')).toBeVisible()
  await expect(page.getByTestId('summary-card-warning')).toBeVisible()
  await expect(page.getByTestId('summary-card-error')).toBeVisible()
  await expect(page.getByTestId('summary-card-critical')).toBeVisible()
})

// E-02: 各サマリーカードの件数が 0 以上の数値として表示される
test('E-02: summary_cards_display_numeric_counts', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  // カードが表示されるまで待機
  await expect(page.getByTestId('summary-card-info')).toBeVisible()

  // 数値として表示されているか確認
  const infoCard = page.getByTestId('summary-card-info')
  const infoText = await infoCard.textContent()
  expect(infoText).toBeTruthy()
  // "12847" など数字が含まれているはず
  expect(infoText).toMatch(/\d+/)

  const criticalCard = page.getByTestId('summary-card-critical')
  const criticalText = await criticalCard.textContent()
  expect(criticalText).toMatch(/\d+/)
})

// E-03: TimeseriesChart エリアが表示される
test('E-03: timeseries_chart_area_is_visible', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  await expect(page.getByTestId('timeseries-chart')).toBeVisible()
})

// E-04: Histogram エリアが表示される
test('E-04: histogram_area_is_visible', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  // histogram か histogram-no-data のどちらかが表示される
  const histogram = page.getByTestId('histogram')
  const noData = page.getByTestId('histogram-no-data')

  await expect(histogram.or(noData)).toBeVisible()
})

// E-05: interval 切替タブが表示され、クリックでアクティブタブが切り替わる
test('E-05: interval_tabs_toggle_active_state_on_click', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  await expect(page.getByTestId('timeseries-chart')).toBeVisible()

  const hourTab = page.getByRole('tab', { name: 'Hour' })
  const dayTab = page.getByRole('tab', { name: 'Day' })
  const weekTab = page.getByRole('tab', { name: 'Week' })

  await expect(hourTab).toBeVisible()
  await expect(dayTab).toBeVisible()
  await expect(weekTab).toBeVisible()

  // 初期状態: Day がアクティブ
  await expect(dayTab).toHaveAttribute('aria-selected', 'true')

  // Hour をクリックするとアクティブになる
  await hourTab.click()
  await expect(hourTab).toHaveAttribute('aria-selected', 'true')
  await expect(dayTab).toHaveAttribute('aria-selected', 'false')
})

// E-06: FilterPanel の要素が表示される
test('E-06: filter_panel_elements_are_visible', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  await expect(page.getByTestId('filter-panel')).toBeVisible()
  await expect(page.getByTestId('filter-start')).toBeVisible()
  await expect(page.getByTestId('filter-end')).toBeVisible()
  await expect(page.getByTestId('filter-severity')).toBeVisible()
  await expect(page.getByTestId('filter-source')).toBeVisible()
  await expect(page.getByTestId('filter-apply')).toBeVisible()
})

// E-07: 日付範囲を入力して Apply を押すと、データが再フェッチされる（ローディング→完了の状態遷移）
test('E-07: applying_date_filter_triggers_data_refetch', async ({ page }) => {
  let summaryCallCount = 0

  await page.route('**/api/v1/logs/analytics/summary**', (route) => {
    summaryCallCount++
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUMMARY),
    })
  })
  await page.route('**/api/v1/logs/analytics/timeseries**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TIMESERIES),
    })
  })

  await page.goto('/')

  // 初期ロード完了を待つ
  await expect(page.getByTestId('summary-card-info')).toBeVisible()
  const initialCallCount = summaryCallCount

  // 日付を入力して Apply: 再フェッチを waitForResponse で捕捉するため click 前に Promise を登録
  await page.getByTestId('filter-start').fill('2026-04-01T00:00')
  await page.getByTestId('filter-end').fill('2026-04-02T00:00')

  const [response] = await Promise.all([
    page.waitForResponse('**/api/v1/logs/analytics/summary**'),
    page.getByTestId('filter-apply').click(),
  ])

  expect(response.status()).toBe(200)
  expect(summaryCallCount).toBeGreaterThan(initialCallCount)

  // カードが再表示される
  await expect(page.getByTestId('summary-card-info')).toBeVisible()
})

// E-08: Severity フィルタで ERROR のみ選択して Apply すると、フィルタが API に渡される
test('E-08: selecting_error_severity_filter_passes_to_api', async ({ page }) => {
  let lastSummaryUrl = ''

  await page.route('**/api/v1/logs/analytics/summary**', (route) => {
    lastSummaryUrl = route.request().url()
    const url = new URL(lastSummaryUrl)
    const severities = url.searchParams.getAll('severity')

    // severity フィルタが適用されていたら対応するデータを返す
    if (severities.length > 0 && severities.every((s) => s === 'ERROR')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUMMARY_ERROR_ONLY),
      })
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUMMARY),
      })
    }
  })
  await page.route('**/api/v1/logs/analytics/timeseries**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TIMESERIES_AFTER_FILTER),
    })
  })

  await page.goto('/')
  await expect(page.getByTestId('summary-card-info')).toBeVisible()

  // ERROR のみ選択
  await page.getByRole('button', { name: 'ERROR' }).click()

  // waitForResponse はクリック前にセットアップして取りこぼしを防ぐ
  const [response] = await Promise.all([
    page.waitForResponse('**/api/v1/logs/analytics/summary**'),
    page.getByTestId('filter-apply').click(),
  ])

  expect(response.status()).toBe(200)
  // フィルタが API に渡されていることを確認
  expect(lastSummaryUrl).toContain('severity=ERROR')
})

// E-09: サイドバーの "Dashboard" リンクが `/` でアクティブ表示になる
test('E-09: dashboard_link_is_active_when_on_root_path', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')

  // AppSidebar の Dashboard リンクが存在する
  const dashboardLink = page.getByRole('link', { name: /Dashboard/i })
  await expect(dashboardLink).toBeVisible()

  // isActive=true のとき内側の SidebarMenuButton（button）に bg-accent クラスが付与される
  await expect(dashboardLink.locator('button')).toHaveClass(/bg-accent/)
})

// E-10: サイドバーの "Log List" リンクをクリックすると `/logs` へ遷移する
test('E-10: clicking_log_list_link_navigates_to_logs_page', async ({ page }) => {
  await setupApiMocks(page)

  // /logs ページも含めてルーティングが必要な場合はモック
  await page.route('**/api/v1/logs**', (route) => {
    const url = route.request().url()
    if (url.includes('/analytics') || url.includes('/sources')) {
      route.continue()
      return
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0, page: 1, limit: 50, pages: 0 }),
    })
  })

  await page.goto('/')
  await expect(page.getByTestId('summary-card-info')).toBeVisible()

  const logListLink = page.getByRole('link', { name: /Log List/i })
  await expect(logListLink).toBeVisible()
  await logListLink.click()

  await expect(page).toHaveURL('/logs')
})
