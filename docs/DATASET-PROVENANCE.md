# Official datasets

Source: organiser General Data folder linked from Challenge Booklet, https://drive.google.com/drive/folders/1d-272bTFyx4QBpWSFe4_kE8-p5S_Zx8q . Downloaded 2026-10-04. The booklet is supplied by the team.

| File | Records | SHA-256 |
|---|---:|---|
| calendar.csv | 910 | 2201b18787287dc9621cde516c22ac7ce656da76ff0ccc956e1325a7b2fc3113 |
| district_travel.csv | 12 | ac31c4d7a8adcbf8e020bec42d9037bc6ece0fc2cabbf116269710dbe2d239c5 |
| outlets.csv | 120 | 206a915f16c9b522473d4ad314d1c7c435345911427d9e0878d6e66241c32c42 |
| road_conditions.csv | 10920 | c54657447feaa1087d123523787e0643c19922439c94ead3c39792f2be32906f |
| service_allowance.csv | 9 | 9b0fe764a50e663ef293a4cb1f9b104ce71b77a3afc863db08228f6e497590a9 |
| traffic_speed.csv | 576 | 2b841682af4dc38a73ea6765a40ac4e060af124d772039ab6d8e81ba2e997bd7 |
| vehicles.csv | 60 | f70175f786574f4c4d07480df263b5ba59918bcecd7a91e5c59d3f7a75b52b1f |

Raw CSVs are retained verbatim; JSON resources are lossless row conversions used by the application. Vehicle temperature and vehicle type are distinct. Outlet display names use official IDs because the dataset does not supply retail names. Driver names outside the submitted demo account are synthetic profile labels.

Calendar does not extend to the submission date; outside its range the explicit booklet rule (Monday–Saturday operations) is used. The routing validator uses free-flow travel/service times from the official files. Traffic-speed and road-condition data are preserved, but live predictive traffic optimisation is not claimed.
