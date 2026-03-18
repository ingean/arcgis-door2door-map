// Desc: Utility functions for handling token authentication
export const getGDOToken = async () => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("username", process.env.GDO_USERNAME);
  urlencoded.append("password", process.env.GDO_PASSWORD);
  urlencoded.append("f", "json");

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow"
  };

  let res = await fetch("https://services.geodataonline.no/arcgis/tokens/generateToken/", requestOptions)
  
  if (!res.ok) {
    console.error(`Failed to get GDO token. Status: ${res.status}`)
    return null
  } 

  let data = await res.json()
  return data.token
}