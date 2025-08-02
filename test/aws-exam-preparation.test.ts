import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AwsExamPreparationStack } from "../lib/aws-exam-preparation-stack";

test('Stack snapshot test', () => {
    const app = new App();
    const stack = new AwsExamPreparationStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    expect(template).toMatchSnapshot();
});
