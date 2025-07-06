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
  }

  type DrillSheet @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    customerID: ID! @index(name: "byCustomer")
    customer: Customer @belongsTo(fields: ["customerID"])
    proshopID: ID! @index(name: "byProShop")
    proshop: ProShop @belongsTo(fields: ["proshopID"])
    createdByEmployeeID: ID! @index(name: "byEmployee")
    createdByEmployee: Employee @belongsTo(fields: ["createdByEmployeeID"])
    name: String!
    gripStyle: GripStyle!
    
    # Span measurements
    thumbToMiddleCutToCut: Float
    thumbToMiddleFull: Float
    thumbToMiddleOuterToCut: Float
    thumbToMiddleFit: Float
    thumbToRingCutToCut: Float
    thumbToRingFull: Float
    thumbToRingOuterToCut: Float
    thumbToRingFit: Float
    middleToRingCutToCut: Float
    middleToRingFull: Float
    middleToRingOuterToCut: Float
    middleToRingFit: Float
    
    # Thumb specifications
    thumbEnabled: Boolean!
    thumbHoleType: HoleType
    thumbPitchForward: Float
    thumbPitchLateral: Float
    thumbSizePrimary: String
    thumbDrillingSequence: AWSJSON
    
    # Finger specifications
    middleFingerPitchForward: Float
    middleFingerPitchLateral: Float
    ringFingerPitchForward: Float
    ringFingerPitchLateral: Float
    middleFingerSize: String
    ringFingerSize: String
    fingerDepthConventional: Float
    fingerDepthFingertip: Float
    
    drillingAngles: AWSJSON
    specialNotes: String
    isTemplate: Boolean!
    workOrders: [DrillWorkOrder] @hasMany(indexName: "byDrillSheet", fields: ["id"])
    createdAt: AWSDateTime!
  }

  type BowlingBall @model @auth(rules: [{ allow: groups, groups: ["ProShopManagers", "DrillTechs"] }]) {
    id: ID!
    customerID: ID! @index(name: "byCustomer")
    customer: Customer @belongsTo(fields: ["customerID"])
    manufacturer: String!
    model: String!
    weight: Int!
    serialNumber: String
    coverstockType: String
    coreType: String
    purchaseDate: AWSDate
    purchasePrice: Float
    status: BallStatus!
    notes: String
    workOrders: [DrillWorkOrder] @hasMany(indexName: "byBall", fields: ["id"])
    createdAt: AWSDateTime!
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
