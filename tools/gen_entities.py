# Generates plain JPA entity classes (fields + getters/setters, no Lombok) for the backend.
import os, re
BASE = os.path.join(os.path.dirname(__file__), '..', 'backend', 'src', 'main', 'java', 'com', 'waynexo', 'domain')
os.makedirs(BASE, exist_ok=True)

ENUMS = {
  'Role': ['DISPATCHER', 'LOADER', 'DRIVER', 'STORE_MANAGER'],
  'Brand': ['FRESH', 'STYLE', 'TECH'],
  'TempClass': ['CHILLED', 'FROZEN', 'AMBIENT', 'AMBIENT_FRAGILE'],
  'VehicleType': ['REEFER', 'DRY_BOX', 'VAN'],
  'VehicleState': ['AVAILABLE', 'LOADING', 'EN_ROUTE', 'IN_WORKSHOP'],
  'OrderStatus': ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'DEFERRED', 'SCHEDULED'],
  'TripStatus': ['PLANNED', 'WAITING', 'LOADING', 'LOADED', 'ACTIVE', 'COMPLETED'],
  'StopStatus': ['UPCOMING', 'CURRENT', 'COMPLETED'],
  'ItemCondition': ['GOOD', 'DAMAGED', 'SHORT', 'MISSING'],
  'Impact': ['HIGH', 'MEDIUM', 'LOW'],
  'Severity': ['CRITICAL', 'WARNING', 'INFO'],
  'EventKind': ['ALERT', 'DRIVER_FEED', 'DOCK_ALERT', 'ACTIVITY'],
  'ProductCategory': ['CHILLED_PRODUCE', 'DAIRY_EGGS', 'DRY_GOODS', 'BAKERY'],
}

# name: (table, [fields])   field: "Type name [opts]"  opts: unique, notnull, len=N, lob, enum, many=Entity, onemany=Entity:mappedBy
ENTITIES = {
  'Depot': ('depots', ['String code unique', 'String name', 'String shortName']),
  'Outlet': ('outlets', ['String code unique', 'Brand brand enum', 'String name', 'String area', 'String district', 'String address',
                         'boolean vanOnlyAccess', 'int outletNo', 'Depot depot many']),
  'AppUser': ('app_users', ['String username unique', 'String employeeId unique', 'String email unique', 'String passwordHash',
                            'String fullName', 'Role role enum', 'String title', 'String avatar', 'Depot depot many', 'Outlet outlet many',
                            'String vehicleCode']),
  'Vehicle': ('vehicles', ['String code unique', 'VehicleType type enum', 'String model', 'Depot depot many', 'VehicleState state enum',
                           'String driverName', 'double capacityKg', 'double capacityM3', 'double fuelQuotaL', 'double fuelUsedL',
                           'int tripsToday', 'int maxTrips']),
  'Product': ('products', ['String sku unique', 'String name', 'ProductCategory category enum', 'TempClass tempClass enum', 'double price',
                           'String unit', 'boolean frequent', 'double unitWeightKg', 'double unitVolumeM3']),
  'StockOrder': ('stock_orders', ['String code unique', 'Outlet outlet many', 'Brand brand enum', 'LocalDate placedDate', 'LocalDate deliveryDate',
                                  'String deliveryWindow', 'double weightKg', 'double volumeM3', 'TempClass tempClass enum', 'OrderStatus status enum',
                                  'String itemsSummary', 'int itemCount', 'String source', 'Vehicle vehicle many', 'Trip trip many',
                                  'String receiptNotes len=2000', 'String receiptSignature lob', 'String damagePhoto lob', 'LocalDateTime receivedAt',
                                  'String exceptionNote len=1000']),
  'OrderLine': ('order_lines', ['StockOrder order many', 'Product product many', 'String name', 'int qty', 'String unit', 'double unitPrice',
                                'Integer receivedQty', 'ItemCondition receivedCondition enum', 'boolean verified']),
  'Trip': ('trips', ['Vehicle vehicle many', 'AppUser driver many', 'LocalDate tripDate', 'int number', 'String name', 'String departs',
                     'double distanceKm', 'TripStatus status enum', 'double allocatedKg', 'double allocatedM3', 'String routeLabel',
                     'String sealNo', 'boolean precooled', 'LocalDateTime dispatchedAt', 'LocalDateTime startedAt', 'LocalDateTime completedAt']),
  'TripStop': ('trip_stops', ['Trip trip many', 'int seq', 'Outlet outlet many', 'StockOrder order many', 'String windowText', 'String eta',
                              'StopStatus status enum', 'String cargo', 'String itemsLabel', 'String loadMode', 'String bay',
                              'String dispatcherNote len=1000', 'boolean loadVerified', 'boolean shortfallFlagged', 'LocalDateTime arrivedAt',
                              'LocalDateTime completedAt', 'String recipientName', 'String signature lob', 'int photoCount']),
  'StopItem': ('stop_items', ['TripStop stop many', 'String sku', 'String name', 'TempClass tempClass enum', 'int expectedQty', 'String unit',
                              'int loadedQty', 'ItemCondition loadCondition enum', 'ItemCondition deliveredCondition enum', 'int damagedQty',
                              'double unitWeightKg', 'double unitVolumeM3']),
  'Deferral': ('deferrals', ['StockOrder order many', 'String reason len=1000', 'Impact impact enum', 'int consecutiveSkips',
                             'String note len=1000', 'boolean resolved', 'boolean acknowledged', 'boolean storeFacing',
                             'LocalDate rescheduledDate', 'String rescheduledWindow', 'LocalDateTime createdAt']),
  'OpsEvent': ('ops_events', ['EventKind kind enum', 'Severity severity enum', 'String title', 'String message len=1000', 'String actor',
                              'String vehicleCode', 'String depotCode', 'boolean resolved', 'LocalDateTime createdAt']),
  'ExceptionReport': ('exception_reports', ['TripStop stop many', 'Trip trip many', 'AppUser reportedBy many', 'String type', 'String details len=2000',
                                            'String severity', 'String clientId unique', 'LocalDateTime createdAt']),
  'PlanningConflict': ('planning_conflicts', ['String vehicleLabel', 'String message len=1000', 'LocalDateTime createdAt']),
}

def jtype(t):
  return t

def cap(s): return s[0].upper() + s[1:]

for name, vals in ENUMS.items():
  with open(os.path.join(BASE, name + '.java'), 'w') as f:
    f.write(f"package com.waynexo.domain;\n\npublic enum {name} {{\n    {', '.join(vals)}\n}}\n")

for name, (table, fields) in ENTITIES.items():
  imports = {'jakarta.persistence.*'}
  body = []
  acc = []
  for spec in fields:
    parts = spec.split()
    t, n, opts = parts[0], parts[1], parts[2:]
    if t in ('LocalDate',): imports.add('java.time.LocalDate')
    if t in ('LocalDateTime',): imports.add('java.time.LocalDateTime')
    ann = []
    if 'many' in opts:
      ann.append('@ManyToOne(fetch = FetchType.LAZY)')
      ann.append(f'@JoinColumn(name = "{re.sub("([A-Z])", r"_\\1", n).lower()}_id")')
    else:
      if 'enum' in opts:
        ann.append('@Enumerated(EnumType.STRING)')
      col = []
      if 'unique' in opts: col.append('unique = true')
      for o in opts:
        if o.startswith('len='): col.append('length = ' + o[4:])
      if 'lob' in opts:
        ann.append('@Lob')
      cname = re.sub('([A-Z])', r'_\1', n).lower()
      if n in ('number', 'order'): cname = n + '_no'
      col.insert(0, f'name = "{cname}"')
      ann.append('@Column(' + ', '.join(col) + ')')
    body.append('\n'.join('    ' + a for a in ann) + f'\n    private {t} {n};\n')
    getter = ('is' if t == 'boolean' else 'get') + cap(n)
    acc.append(f'    public {t} {getter}() {{ return {n}; }}\n    public void set{cap(n)}({t} {n}) {{ this.{n} = {n}; }}\n')
  src = f"package com.waynexo.domain;\n\n" + ''.join(f'import {i};\n' for i in sorted(imports)) + f"""
@Entity
@Table(name = "{table}")
public class {name} {{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

{chr(10).join(body)}
    public Long getId() {{ return id; }}
    public void setId(Long id) {{ this.id = id; }}
{''.join(acc)}}}
"""
  with open(os.path.join(BASE, name + '.java'), 'w') as f: f.write(src)
print('ok', len(ENTITIES), 'entities', len(ENUMS), 'enums')
