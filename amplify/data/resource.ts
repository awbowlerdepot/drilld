import { defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = /* GraphQL */ `
  type ProShop @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers"] }]) {
    id: ID!
    businessName: String!
    ownerName: String!
    subscriptionTier: SubscriptionTier!
    billingEmail: AWSEmail!
    phone: AWSPhone
    address: String
    settings: AWSJSON
    active: Boolean!
    employees: [Employee] @hasMany(indexName: "byProShop", fields: ["id"])
    locations: [Location] @hasMany(indexName: "byProShop", fields: ["id"])
    customers: [Customer] @hasMany(indexName: "byProShop", fields: ["id"])
    drillSheets: [DrillSheet] @hasMany(indexName: "byProShop", fields: ["id"])
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  type Employee @model @auth(rules: [
    { allow: groups, groups: ["ProShopManagers"] },
    { allow: owner, operations: [read, update] }
  ]) {
    id: ID!
    proshopID: ID! @index(name: "byProShop")
    proshop: ProShop @belongsTo(fields: ["proshopID"])
    cognitoUserID: String! @index(name: "byCognitoUser")
    username: String!
    email: AWSEmail!
    firstName: String!
    lastName: String!
    phone: AWSPhone
    role: EmployeeRole!
    permissions: [String]
    certifications: AWSJSON
    hireDate: AWSDate
    hourlyRate: Float
    locations: [String]
    specialties: [String]
    active: Boolean!
    drillSheets: [DrillSheet] @hasMany(indexName: "byEmployee", fields: ["id"])
    workOrders: [DrillWorkOrder] @hasMany(indexName: "byEmployee", fields: ["id"])
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  type Location @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    proshopID: ID! @index(name: "byProShop")
    proshop: ProShop @belongsTo(fields: ["proshopID"])
    name: String!
    address: String
    phone: AWSPhone
    equipmentInfo: AWSJSON
    hours: AWSJSON
    active: Boolean!
    workOrders: [DrillWorkOrder] @hasMany(indexName: "byLocation", fields: ["id"])
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  type Customer @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    proshopID: ID! @index(name: "byProShop")
    proshop: ProShop @belongsTo(fields: ["proshopID"])
    firstName: String!
    lastName: String!
    email: AWSEmail
    phone: AWSPhone
    dominantHand: Hand!
    preferredGripStyle: GripStyle!
    usesThumb: Boolean!
    notes: String
    bowlingBalls: [BowlingBall] @hasMany(indexName: "byCustomer", fields: ["id"])
    drillSheets: [DrillSheet] @hasMany(indexName: "byCustomer", fields: ["id"])
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  type DrillSheet @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    customerID: ID! @index(name: "byCustomer")
    customer: Customer @belongsTo(fields: ["customerID"])
    proshopID: ID! @index(name: "byProShop")
    proshop: ProShop @belongsTo(fields: ["proshopID"])
    employeeID: ID! @index(name: "byEmployee")
    employee: Employee @belongsTo(fields: ["employeeID"])
    name: String!
    isTemplate: Boolean!
    gripStyle: GripStyle!
    handType: Hand!
    usesThumb: Boolean!
    
    # Span measurements
    thumbToMiddleFitSpan: Float
    thumbToRingFitSpan: Float
    thumbToMiddleStretchSpan: Float
    thumbToRingStretchSpan: Float
    bridgeDistance: Float!
    
    # Hole specifications
    thumbHoleSize: String
    thumbHoleType: HoleType
    thumbHolePitch: String
    middleHoleSize: String!
    middleHolePitch: String
    ringHoleSize: String!
    ringHolePitch: String
    
    # Layout information
    pinPosition: String
    layoutNotes: String
    specialNotes: String
    
    # Metadata
    dateCreated: AWSDateTime!
    lastModified: AWSDateTime!
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  type BowlingBall @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    customerID: ID! @index(name: "byCustomer")
    customer: Customer @belongsTo(fields: ["customerID"])
    manufacturer: String!
    model: String!
    weight: Int!
    serialNumber: String
    purchaseDate: AWSDate
    status: BallStatus!
    notes: String
    workOrders: [DrillWorkOrder] @hasMany(indexName: "byBall", fields: ["id"])
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  type DrillWorkOrder @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    ballID: ID! @index(name: "byBall")
    ball: BowlingBall @belongsTo(fields: ["ballID"])
    drillSheetID: ID! @index(name: "byDrillSheet")
    drillSheet: DrillSheet @belongsTo(fields: ["drillSheetID"])
    locationID: ID! @index(name: "byLocation")
    location: Location @belongsTo(fields: ["locationID"])
    performedByEmployeeID: ID @index(name: "byEmployee")
    performedByEmployee: Employee @belongsTo(fields: ["performedByEmployeeID"])
    workType: WorkType!
    workDate: AWSDateTime!
    startTime: AWSDateTime
    endTime: AWSDateTime
    laborHours: Float
    laborCost: Float
    materialsCost: Float
    totalCost: Float
    workNotes: String
    deviationsFromSpec: String
    customerSatisfaction: Int
    warrantyPeriod: Int
    beforePhotos: [String]
    afterPhotos: [String]
    qualityCheck: Boolean
    qualityNotes: String
    createdAt: AWSDateTime!
    updatedAt: AWSDateTime!
  }

  enum SubscriptionTier {
    BASIC
    PREMIUM
    ENTERPRISE
  }

  enum EmployeeRole {
    MANAGER
    SENIOR_TECH
    TECHNICIAN
    APPRENTICE
  }

  enum Hand {
    LEFT
    RIGHT
  }

  enum GripStyle {
    CONVENTIONAL
    FINGERTIP
    TWO_HANDED_NO_THUMB
  }

  enum HoleType {
    ROUND
    OVAL
  }

  enum BallStatus {
    ACTIVE
    RETIRED
    DAMAGED
  }

  enum WorkType {
    INITIAL_DRILL
    PLUG_REDRILL
    MAINTENANCE
  }
`;

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});