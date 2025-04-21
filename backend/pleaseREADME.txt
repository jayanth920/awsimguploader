REST API ONLY
ENABLE CORS.
INCRAESE THE CONFIG TIME FOR lambda
ADD TRIGGER.

Runtime settings 
 
Info
Edit
Edit runtime management configuration
Runtime
Python 3.12
Handler
Info
lambda_function.lambda_handler
Architecture
Info
x86_64

Runtime management configuration
Layers 
 
Info
Edit
Add a layer

Merge order	Name	Layer version	Compatible runtimes	Compatible architectures	Version ARN
1	Klayers-p312-pillow	2	python3.12	x86_64	arn:aws:lambda:us-east-2:770693421928:layer:Klayers-p312-pillow:2
2	dnspython	1	python3.12	-	arn:aws:lambda:us-east-2:211125645876:layer:dnspython:1
3	pymongo	1	python3.12	-	arn:aws:lambda:us-east-2:211125645876:layer:pymongo:1
4	bson	1	python3.12	-	arn:aws:lambda:us-east-2:211125645876:layer:bson:1
