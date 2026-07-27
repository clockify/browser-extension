if [[ ! "$CI_COMMIT_BRANCH" =~ ^[0-9]+- ]]; then
  exit 0
fi

TASK_ID=$(echo "$CI_COMMIT_BRANCH" | cut -d'-' -f1)

curl https://api.plaky.com/v1/public/spaces/6/boards/226/items/"$TASK_ID"/fields \
  --request PATCH \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header "X-API-Key: $EXT_PLAKY_API_KEY" \
  --data '{
    "status-1": "4",
    "link-1": "https://linux.coingdevelopment.com/EXT/qa_build/'"$CI_COMMIT_BRANCH"'"
  }'