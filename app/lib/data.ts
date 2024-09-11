import { sql } from "@vercel/postgres";
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from "./definitions";
import { formatCurrency } from "./utils";

import axios from "axios";

const API_URL = "http://211.108.22.198:8720/next";

// 수익 데이터 가져오기 (fetchRevenue 대체)
export async function ApiFetchRevenue() {
  try {
    const response = await axios.get(`${API_URL}/revenue`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

// 최신 인보이스 가져오기 (fetchLatestInvoices 대체)
export async function ApiFetchLatestInvoices() {
  try {
    const response = await axios.get(`${API_URL}/latest-invoices`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

// 카드 데이터 가져오기 (fetchCardData 대체)
export async function ApiFetchCardData() {
  try {
    const response = await axios.get(`${API_URL}/invoice-card-data`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

// 필터링된 인보이스 가져오기 (fetchFilteredInvoices 대체)
export async function ApiFetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  try {
    const response = await axios.get(`${API_URL}/filtered-invoices`, {
      params: {
        query,
        page: currentPage,
      },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

// 인보이스 페이지 개수 가져오기 (fetchInvoicesPages 대체)
export async function ApiFetchInvoicesPages(query: string) {
  try {
    const response = await axios.get(`${API_URL}/invoices-pages`, {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

// 특정 인보이스 ID로 인보이스 가져오기 (fetchInvoiceById 대체)
export async function ApiFetchInvoiceById(id: string) {
  try {
    const response = await axios.get(`${API_URL}/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

// 고객 목록 가져오기 (fetchCustomers 대체)
export async function ApiFetchCustomers() {
  try {
    const response = await axios.get(`${API_URL}/customers`);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch all customers.");
  }
}

// 필터링된 고객 목록 가져오기 (fetchFilteredCustomers 대체)
export async function ApiFetchFilteredCustomers(query: string) {
  try {
    const response = await axios.get(`${API_URL}/filtered-customers`, {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to fetch customer table.");
  }
}

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log("Fetching revenue data...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    console.log("Data fetch completed after 3 seconds.");

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? "0");
    const numberOfCustomers = Number(data[1].rows[0].count ?? "0");
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? "0");
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? "0");

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch customer table.");
  }
}
