# prompts
- Create a service that calls an endpoint to fetch new error details record. The response expected is XML. 
- Take that XML and parse it and convert it into the errors details form. You will need to refer to the errorsDetails.xsd to get the field types.
- use the mockErrors.txt as a sample xml
- create a new page for this form. This form should use the same styling like the details component form. This page should also have the other components and layout as seen in the details page. For the list of errors, stub something and also for the notes, leave it blank
- The form should have a submit button. Clicking on the submit button should call a post endpoint and post an XML version fo the form with changes.
- On a successful post, make a new fetch call to get the next error details record. 
- Consider each block of <form4868> in mockErrors.txt as one error details record
- this component should be routable by itself
- show a flash message saying form is submitted successfully and new record is retrieved after the submit is clicked and post is successful
- mock or stub as needed


