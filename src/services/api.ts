import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { get, post } from 'aws-amplify/api';

// Generate the client for GraphQL operations
const client = generateClient<Schema>();

export class DrillSheetAPI {
  // GraphQL operations
  async getCustomers() {
    return await client.models.Customer.list();
  }

  async createCustomer(customerData: Schema['Customer']['type']) {
    return await client.models.Customer.create(customerData);
  }

  async getDrillSheets(customerId?: string) {
    if (customerId) {
      return await client.models.DrillSheet.list({
        filter: { customerID: { eq: customerId } }
      });
    }
    return await client.models.DrillSheet.list();
  }

  async createDrillSheet(drillSheetData: Schema['DrillSheet']['type']) {
    return await client.models.DrillSheet.create(drillSheetData);
  }

  async getWorkOrders() {
    return await client.models.DrillWorkOrder.list();
  }

  async createWorkOrder(workOrderData: Schema['DrillWorkOrder']['type']) {
    return await client.models.DrillWorkOrder.create(workOrderData);
  }

  // Custom API operations
  async getDashboardAnalytics() {
    const restOperation = get({
      apiName: 'drillSheetApi',
      path: '/analytics/dashboard'
    });
    return await restOperation.response;
  }

  async getDrillSpecificationReport() {
    const restOperation = get({
      apiName: 'drillSheetApi',
      path: '/reports/drill-specifications'
    });
    return await restOperation.response;
  }
}

export const api = new DrillSheetAPI();
