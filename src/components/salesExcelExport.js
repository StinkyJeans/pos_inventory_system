"use client";

import ExcelJS from "exceljs";
import { supabase } from "@/lib/supabase";

export async function downloadSalesExcel(range) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);

  const [todayIso, weekIso, monthIso] = [
    todayStart.toISOString(),
    weekStart.toISOString(),
    monthStart.toISOString(),
  ];

  const fetchAll = range === "all";

  const prevTodayStart = new Date(todayStart);
  prevTodayStart.setDate(prevTodayStart.getDate() - 1);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevTodayIso = prevTodayStart.toISOString();
  const prevWeekIso = prevWeekStart.toISOString();
  const prevMonthIso = prevMonthStart.toISOString();

  const [
    { data: ordersToday },
    { data: ordersWeek },
    { data: ordersMonth },
    { data: ordersPrevToday },
    { data: ordersPrevWeek },
    { data: ordersPrevMonth },
    { data: itemsToday },
    { data: itemsWeek },
    { data: itemsMonth },
    { data: productsData },
    { data: categoriesData },
  ] = await Promise.all([
    supabase.from("orders").select("id, total, subtotal, tax, created_at, status").eq("status", "completed").gte("created_at", todayIso).order("created_at", { ascending: false }),
    supabase.from("orders").select("id, total, subtotal, tax, created_at, status").eq("status", "completed").gte("created_at", weekIso).order("created_at", { ascending: false }),
    supabase.from("orders").select("id, total, subtotal, tax, created_at, status").eq("status", "completed").gte("created_at", monthIso).order("created_at", { ascending: false }),
    supabase.from("orders").select("id, total").eq("status", "completed").gte("created_at", prevTodayIso).lt("created_at", todayIso),
    supabase.from("orders").select("id, total").eq("status", "completed").gte("created_at", prevWeekIso).lt("created_at", weekIso),
    supabase.from("orders").select("id, total").eq("status", "completed").gte("created_at", prevMonthIso).lt("created_at", monthIso),
    supabase.from("order_items").select("product_id, product_name, quantity, line_total").gte("created_at", todayIso),
    supabase.from("order_items").select("product_id, product_name, quantity, line_total").gte("created_at", weekIso),
    supabase.from("order_items").select("product_id, product_name, quantity, line_total").gte("created_at", monthIso),
    supabase.from("products").select("id, category_id, cost"),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);

  const ordersTodayList = ordersToday ?? [];
  const ordersWeekList = ordersWeek ?? [];
  const ordersMonthList = ordersMonth ?? [];
  const itemsTodayList = itemsToday ?? [];
  const itemsWeekList = itemsWeek ?? [];
  const itemsMonthList = itemsMonth ?? [];

  const productToCategory = {};
  (productsData || []).forEach((p) => (productToCategory[p.id] = p.category_id));
  const categoryNames = {};
  (categoriesData || []).forEach((c) => (categoryNames[c.id] = c.name));
  const productCostLookup = Object.fromEntries((productsData || []).map((p) => [String(p.id), Number(p.cost) || 0]));

  function buildByNameAndCategory(items) {
    const byName = {};
    const categoryMap = {};
    (items || []).forEach((row) => {
      const costPerUnit = productCostLookup[String(row.product_id)] ?? 0;
      const lineCost = row.quantity * costPerUnit;
      if (!byName[row.product_name]) byName[row.product_name] = { name: row.product_name, quantity: 0, revenue: 0, cost: 0 };
      byName[row.product_name].quantity += row.quantity;
      byName[row.product_name].revenue += Number(row.line_total);
      byName[row.product_name].cost += lineCost;
      const catId = productToCategory[row.product_id] || null;
      const catName = catId ? categoryNames[catId] || "Uncategorized" : "Uncategorized";
      if (!categoryMap[catName]) categoryMap[catName] = { products: {}, total: 0, unitsSold: 0 };
      if (!categoryMap[catName].products[row.product_name]) categoryMap[catName].products[row.product_name] = { quantity: 0, revenue: 0 };
      categoryMap[catName].products[row.product_name].quantity += row.quantity;
      categoryMap[catName].products[row.product_name].revenue += Number(row.line_total);
      categoryMap[catName].total += Number(row.line_total);
      categoryMap[catName].unitsSold += row.quantity;
    });
    const topItemsList = Object.values(byName).sort((a, b) => b.revenue - a.revenue);
    const categoryList = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        products: Object.entries(data.products).map(([pName, p]) => ({ name: pName, quantity: p.quantity, revenue: p.revenue })),
        total: data.total,
        unitsSold: data.unitsSold,
      }))
      .sort((a, b) => b.total - a.total);
    return { topItemsList, categoryList };
  }

  const todayData = buildByNameAndCategory(itemsTodayList);
  const weekData = buildByNameAndCategory(itemsWeekList);
  const monthData = buildByNameAndCategory(itemsMonthList);

  const sum = (arr) => (arr || []).reduce((s, o) => s + Number(o.total), 0);
  const ordersList = range === "today" ? ordersTodayList : range === "week" ? ordersWeekList : ordersMonthList;
  const data = range === "today" ? todayData : range === "week" ? weekData : monthData;
  const periodLabel = range === "today" ? "Today" : range === "week" ? "Last 7 days" : range === "all" ? "All periods" : "Last 30 days";

  const prevOrdersList = range === "today" ? (ordersPrevToday ?? []) : range === "week" ? (ordersPrevWeek ?? []) : (ordersPrevMonth ?? []);
  const prevRevenue = sum(prevOrdersList);
  const prevCount = prevOrdersList.length;
  const totalRevenue = sum(ordersList);
  const orderCount = ordersList.length;
  const aov = orderCount ? totalRevenue / orderCount : 0;
  const ordersPctChange = prevCount ? (((orderCount - prevCount) / prevCount) * 100).toFixed(1) : null;
  const revenuePctChange = prevRevenue ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null;

  const wb = new ExcelJS.Workbook();
  wb.creator = "POS Sales";
  wb.created = new Date();

  const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE68A" } };
  const SECTION_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
  const TITLE_FONT = { bold: true, size: 14 };
  const HEADER_FONT = { bold: true, size: 11 };
  const ALL_BORDER = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  const CURRENCY_FMT = "$#,##0.00";
  const PERCENT_FMT = "0.0%";

  function styleHeaderRow(sheet, rowNum) {
    for (let c = 1; c <= 10; c++) {
      const cell = sheet.getCell(rowNum, c);
      if (cell.value != null) {
        cell.font = HEADER_FONT;
        cell.fill = HEADER_FILL;
        cell.border = ALL_BORDER;
      }
    }
  }

  function styleDataRow(sheet, rowNum, currencyCols = [], numCols = []) {
    for (let c = 1; c <= 10; c++) {
      const cell = sheet.getCell(rowNum, c);
      if (cell.value != null) {
        cell.border = ALL_BORDER;
        if (currencyCols.includes(c)) cell.numFmt = CURRENCY_FMT;
        if (numCols.includes(c)) cell.numFmt = "#,##0";
      }
    }
  }

  function byDayFromOrders(ordersL) {
    const byDate = {};
    (ordersL || []).forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { date: key, label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), revenue: 0, orders: 0 };
      byDate[key].revenue += Number(o.total);
      byDate[key].orders += 1;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }

  if (fetchAll) {
    const summarySheet = wb.addWorksheet("Executive summary", { views: [{ state: "frozen", ySplit: 1 }] });
    const allTotal = sum(ordersTodayList) + sum(ordersWeekList) + sum(ordersMonthList);
    const allCount = ordersTodayList.length + ordersWeekList.length + ordersMonthList.length;
    const allAov = allCount ? allTotal / allCount : 0;

    summarySheet.addRow(["Executive summary", "All periods"]);
    summarySheet.getCell(1, 1).font = TITLE_FONT;
    summarySheet.getCell(1, 1).fill = SECTION_FILL;
    summarySheet.addRow([]);
    summarySheet.addRow(["Period covered", "Today, Last 7 days, Last 30 days"]);
    summarySheet.addRow(["Total revenue", allTotal]);
    summarySheet.addRow(["Total orders / transactions", allCount]);
    summarySheet.addRow(["Average order value (all)", allAov]);
    summarySheet.getCell(4, 2).numFmt = CURRENCY_FMT;
    summarySheet.getCell(6, 2).numFmt = CURRENCY_FMT;
    summarySheet.addRow([]);
    summarySheet.addRow(["By period"]);
    summarySheet.getCell(8, 1).font = HEADER_FONT;
    summarySheet.getCell(8, 1).fill = SECTION_FILL;
    summarySheet.addRow(["Period", "Orders", "Total revenue"]);
    styleHeaderRow(summarySheet, 9);
    summarySheet.addRow(["Today", ordersTodayList.length, sum(ordersTodayList)]);
    summarySheet.addRow(["Last 7 days", ordersWeekList.length, sum(ordersWeekList)]);
    summarySheet.addRow(["Last 30 days", ordersMonthList.length, sum(ordersMonthList)]);
    for (let r = 10; r <= 12; r++) {
      summarySheet.getCell(r, 2).numFmt = "#,##0";
      summarySheet.getCell(r, 3).numFmt = CURRENCY_FMT;
    }
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 14;
    summarySheet.getColumn(3).width = 14;

    const ordersSheet = wb.addWorksheet("Orders");
    ordersSheet.addRow(["Date & time", "Order ID", "Subtotal", "Tax", "Total", "Status"]);
    styleHeaderRow(ordersSheet, 1);
    if (ordersMonthList.length) {
      ordersMonthList.forEach((o, i) => {
        ordersSheet.addRow([
          new Date(o.created_at),
          o.id,
          Number(o.subtotal ?? o.total),
          Number(o.tax ?? 0),
          Number(o.total),
          o.status || "completed",
        ]);
        styleDataRow(ordersSheet, i + 2, [3, 4, 5]);
      });
    } else {
      ordersSheet.addRow(["No orders"]);
    }
    ordersSheet.getColumn(1).width = 20;
    ordersSheet.getColumn(2).width = 38;
    ordersSheet.getColumn(3).width = 12;
    ordersSheet.getColumn(4).width = 12;
    ordersSheet.getColumn(5).width = 12;
    ordersSheet.getColumn(6).width = 12;

    const byDayTodayArr = byDayFromOrders(ordersTodayList);
    const byDayWeekArr = byDayFromOrders(ordersWeekList);
    const byDayMonthArr = byDayFromOrders(ordersMonthList);
    const byDayAll = [...byDayMonthArr].sort((a, b) => a.date.localeCompare(b.date)).map((r) => {
      const inToday = byDayTodayArr.some((t) => t.date === r.date);
      const inWeek = byDayWeekArr.some((w) => w.date === r.date);
      const period = inToday ? "Today" : inWeek ? "Week" : "Month";
      const avgOrder = r.orders ? r.revenue / r.orders : 0;
      return [period, r.date, r.label, r.revenue, r.orders, avgOrder];
    });

    const salesSheet = wb.addWorksheet("Sales by time");
    salesSheet.addRow(["Period", "Date", "Label", "Revenue", "Order count", "Avg order value"]);
    styleHeaderRow(salesSheet, 1);
    byDayAll.forEach((row, i) => {
      salesSheet.addRow(row);
      styleDataRow(salesSheet, i + 2, [4, 6], [5]);
    });
    salesSheet.getColumn(1).width = 10;
    salesSheet.getColumn(2).width = 12;
    salesSheet.getColumn(3).width = 16;
    salesSheet.getColumn(4).width = 12;
    salesSheet.getColumn(5).width = 12;
    salesSheet.getColumn(6).width = 14;

    [["Today", todayData], ["Week", weekData], ["Month", monthData]].forEach(([label, d]) => {
      const totalRev = d.topItemsList.reduce((s, i) => s + i.revenue, 0);
      const prodSheet = wb.addWorksheet(`Product performance ${label}`);
      prodSheet.addRow(["Product name", "Units sold", "Revenue", "Cost", "Margin", "% of total revenue"]);
      styleHeaderRow(prodSheet, 1);
      d.topItemsList.forEach((item, i) => {
        const pct = totalRev ? (item.revenue / totalRev) : 0;
        prodSheet.addRow([
          item.name,
          item.quantity,
          item.revenue,
          item.cost ?? 0,
          (item.revenue ?? 0) - (item.cost ?? 0),
          pct,
        ]);
        styleDataRow(prodSheet, i + 2, [3, 4, 5], [2]);
        prodSheet.getCell(i + 2, 6).numFmt = PERCENT_FMT;
      });
      prodSheet.getColumn(1).width = 28;
      [2, 3, 4, 5, 6].forEach((c) => { prodSheet.getColumn(c).width = 14; });
    });

    [["Today", todayData], ["Week", weekData], ["Month", monthData]].forEach(([label, d]) => {
      const perfSheet = wb.addWorksheet(`Category performance ${label}`);
      perfSheet.addRow(["Category name", "Revenue", "Units sold"]);
      styleHeaderRow(perfSheet, 1);
      d.categoryList.forEach((cat, i) => {
        perfSheet.addRow([cat.name, cat.total, cat.unitsSold ?? 0]);
        styleDataRow(perfSheet, i + 2, [2], [3]);
      });
      perfSheet.getColumn(1).width = 24;
      perfSheet.getColumn(2).width = 14;
      perfSheet.getColumn(3).width = 12;

      const catSheet = wb.addWorksheet(`By category ${label}`);
      let catRow = 1;
      d.categoryList.forEach((cat) => {
        catSheet.addRow([cat.name, "", "", ""]);
        catSheet.getCell(catRow, 1).font = HEADER_FONT;
        catSheet.getCell(catRow, 1).fill = SECTION_FILL;
        catRow++;
        catSheet.addRow(["Product", "Quantity", "Revenue", ""]);
        styleHeaderRow(catSheet, catRow);
        catRow++;
        cat.products.forEach((p) => {
          catSheet.addRow([p.name, p.quantity, p.revenue, ""]);
          styleDataRow(catSheet, catRow, [3]);
          catRow++;
        });
        catSheet.addRow(["Category total", "", cat.total, ""]);
        catSheet.getCell(catRow, 3).numFmt = CURRENCY_FMT;
        catRow += 2;
      });
      catSheet.getColumn(1).width = 28;
      catSheet.getColumn(2).width = 10;
      catSheet.getColumn(3).width = 12;
    });
  } else {
    const summarySheet = wb.addWorksheet("Executive summary", { views: [{ state: "frozen", ySplit: 1 }] });
    summarySheet.addRow(["Executive summary", periodLabel]);
    summarySheet.getCell(1, 1).font = TITLE_FONT;
    summarySheet.getCell(1, 1).fill = SECTION_FILL;
    summarySheet.addRow([]);
    summarySheet.addRow(["Period covered", periodLabel]);
    summarySheet.addRow(["Total revenue", totalRevenue]);
    summarySheet.addRow(["Total orders / transactions", orderCount]);
    summarySheet.addRow(["Average order value", aov]);
    summarySheet.getCell(4, 2).numFmt = CURRENCY_FMT;
    summarySheet.getCell(6, 2).numFmt = CURRENCY_FMT;
    if (ordersPctChange != null || revenuePctChange != null) {
      summarySheet.addRow([]);
      summarySheet.addRow(["Comparison to previous period", ""]);
      summarySheet.getCell(summarySheet.rowCount, 1).font = HEADER_FONT;
      summarySheet.getCell(summarySheet.rowCount, 1).fill = SECTION_FILL;
      if (ordersPctChange != null) {
        summarySheet.addRow(["Orders % change", Number(ordersPctChange) / 100]);
        summarySheet.getCell(summarySheet.rowCount, 2).numFmt = PERCENT_FMT;
      }
      if (revenuePctChange != null) {
        summarySheet.addRow(["Revenue % change", Number(revenuePctChange) / 100]);
        summarySheet.getCell(summarySheet.rowCount, 2).numFmt = PERCENT_FMT;
      }
    }
    summarySheet.getColumn(1).width = 28;
    summarySheet.getColumn(2).width = 14;

    const ordersSheet = wb.addWorksheet("Orders");
    ordersSheet.addRow(["Date & time", "Order ID", "Subtotal", "Tax", "Total", "Status"]);
    styleHeaderRow(ordersSheet, 1);
    if (ordersList.length) {
      ordersList.forEach((o, i) => {
        ordersSheet.addRow([
          new Date(o.created_at),
          o.id,
          Number(o.subtotal ?? o.total),
          Number(o.tax ?? 0),
          Number(o.total),
          o.status || "completed",
        ]);
        styleDataRow(ordersSheet, i + 2, [3, 4, 5]);
      });
    } else {
      ordersSheet.addRow(["No orders"]);
    }
    ordersSheet.getColumn(1).width = 20;
    ordersSheet.getColumn(2).width = 38;
    ordersSheet.getColumn(3).width = 12;
    ordersSheet.getColumn(4).width = 12;
    ordersSheet.getColumn(5).width = 12;
    ordersSheet.getColumn(6).width = 12;

    const byDayArr = byDayFromOrders(ordersList);
    const salesSheet = wb.addWorksheet("Sales by time");
    salesSheet.addRow(["Date", "Label", "Revenue", "Order count", "Avg order value"]);
    styleHeaderRow(salesSheet, 1);
    byDayArr.forEach((r, i) => {
      salesSheet.addRow([r.date, r.label, r.revenue, r.orders, r.orders ? r.revenue / r.orders : 0]);
      styleDataRow(salesSheet, i + 2, [3, 5], [4]);
    });
    salesSheet.getColumn(1).width = 12;
    salesSheet.getColumn(2).width = 16;
    salesSheet.getColumn(3).width = 12;
    salesSheet.getColumn(4).width = 12;
    salesSheet.getColumn(5).width = 14;

    const totalRev = data.topItemsList.reduce((s, i) => s + i.revenue, 0);
    const prodSheet = wb.addWorksheet("Product performance");
    prodSheet.addRow(["Product name", "Units sold", "Revenue", "Cost", "Margin", "% of total revenue"]);
    styleHeaderRow(prodSheet, 1);
    data.topItemsList.forEach((item, i) => {
      const pct = totalRev ? (item.revenue / totalRev) : 0;
      prodSheet.addRow([
        item.name,
        item.quantity,
        item.revenue,
        item.cost ?? 0,
        (item.revenue ?? 0) - (item.cost ?? 0),
        pct,
      ]);
      styleDataRow(prodSheet, i + 2, [3, 4, 5], [2]);
      prodSheet.getCell(i + 2, 6).numFmt = PERCENT_FMT;
    });
    prodSheet.getColumn(1).width = 28;
    [2, 3, 4, 5, 6].forEach((c) => { prodSheet.getColumn(c).width = 14; });

    const perfSheet = wb.addWorksheet("Category performance");
    perfSheet.addRow(["Category name", "Revenue", "Units sold"]);
    styleHeaderRow(perfSheet, 1);
    data.categoryList.forEach((cat, i) => {
      perfSheet.addRow([cat.name, cat.total, cat.unitsSold ?? 0]);
      styleDataRow(perfSheet, i + 2, [2], [3]);
    });
    perfSheet.getColumn(1).width = 24;
    perfSheet.getColumn(2).width = 14;
    perfSheet.getColumn(3).width = 12;

    const catSheet = wb.addWorksheet("By category");
    let catRow = 1;
    data.categoryList.forEach((cat) => {
      catSheet.addRow([cat.name, "", "", ""]);
      catSheet.getCell(catRow, 1).font = HEADER_FONT;
      catSheet.getCell(catRow, 1).fill = SECTION_FILL;
      catRow++;
      catSheet.addRow(["Product", "Quantity", "Revenue", ""]);
      styleHeaderRow(catSheet, catRow);
      catRow++;
      cat.products.forEach((p) => {
        catSheet.addRow([p.name, p.quantity, p.revenue, ""]);
        styleDataRow(catSheet, catRow, [3]);
        catRow++;
      });
      catSheet.addRow(["Category total", "", cat.total, ""]);
      catSheet.getCell(catRow, 3).numFmt = CURRENCY_FMT;
      catRow += 2;
    });
    catSheet.getColumn(1).width = 28;
    catSheet.getColumn(2).width = 10;
    catSheet.getColumn(3).width = 12;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = range === "all" ? `sales-all-periods-${dateStr}.xlsx` : `sales-${range}-${dateStr}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
