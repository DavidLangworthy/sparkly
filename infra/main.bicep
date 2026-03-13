targetScope = 'resourceGroup'

@description('Azure region used for the resource group itself.')
param location string

@description('Azure region display name for the Static Web App resource.')
param staticWebAppLocation string = 'Central US'

@description('Short application name. Use lowercase letters, numbers, and hyphens only.')
param appName string = 'sparkly'

var appNamePrefix = take(toLower(appName), 32)
var uniqueSuffix = take(uniqueString(subscription().subscriptionId, resourceGroup().id, appNamePrefix), 6)
var staticWebAppName = '${appNamePrefix}-${uniqueSuffix}'

resource staticSite 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: staticWebAppLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  tags: {
    app: appNamePrefix
    provisionedBy: 'sparkly-scripts'
    resourceGroupLocation: location
  }
  properties: {}
}

output staticWebAppName string = staticSite.name
output defaultHostname string = staticSite.properties.defaultHostname
output staticWebAppId string = staticSite.id
