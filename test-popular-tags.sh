echo "Testing Popular Tags Endpoint"
curl -X GET http://localhost:3000/api/tags/popular?limit=5
